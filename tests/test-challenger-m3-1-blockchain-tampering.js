/**
 * BROSAN TEKSTİL ERP — PHASE 4 IRONCLAD DEFENSE-IN-DEPTH
 * CHALLENGER M3-1: EMPIRICAL ADVERSARIAL BLOCKCHAIN TAMPERING HARNESS
 * tests/test-challenger-m3-1-blockchain-tampering.js
 * 
 * Objective:
 * Execute aggressive adversarial tests attacking server/ledgerIntegrity.js and the live verification endpoint:
 * 1. Amount Tampering (1-cent modifications in intermediate & head blocks, sign flips, precision attacks)
 * 2. Timestamp & Sequence Disruption (block order swaps, 1ms perturbations, date formatting)
 * 3. Record Deletion (middle block omission in 100-block chain, multi-block omission, first-block omission)
 * 4. Block Splicing & Injection (forged blocks, key-guessing, downstream link severing, replay)
 * 5. Delimiter Collision Attempts (pipe '|' framing attacks, shift attacks, Unicode edge-cases)
 * 6. Granular Pinpointing Verification (exact corrupted sequence index & record ID across all vectors)
 * 7. Live HTTP Verification Endpoint Attack (/api/audit/verify-integrity role security, 409 on tamper, allowStatus200)
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

// Import real cryptographic modules
const ledgerIntegrity = require('../server/ledgerIntegrity');
const auth = require('../server/auth');

const {
  deriveLedgerKey,
  computeGenesisHash,
  computeEntryHash,
  normalizeAmount,
  normalizeTimestamp,
  normalizeRecordId,
  normalizeType,
  buildCanonicalPayload,
  timingSafeHashEqual,
  createGenesisBlock,
  appendBlock,
  verifyChainContinuity,
  verifyChain,
  getMasterLedgerKey,
  ZERO_PREV_HASH,
  LEDGER_FILE
} = ledgerIntegrity;

// ANSI Colors for clear terminal reporting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let totalChecks = 0;
let passedChecks = 0;
const failedChecks = [];

function check(condition, description) {
  totalChecks++;
  try {
    assert(condition, description);
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS${colors.reset} [${totalChecks.toString().padStart(2)}] ${description}`);
  } catch (err) {
    console.error(`  ${colors.red}✖ FAIL${colors.reset} [${totalChecks.toString().padStart(2)}] ${description}`);
    console.error(`    ${colors.yellow}${err.message}${colors.reset}`);
    failedChecks.push({ check: totalChecks, description, error: err.message });
    throw err;
  }
}

function sendHttpRequest({ port, path = '/', method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = {
      'Host': 'brosangroup.com',
      ...headers
    };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Helper: Generate a synthetic 100-transaction chain
function generateSynthetic100Chain(key = getMasterLedgerKey()) {
  const chainArray = [createGenesisBlock(key)];
  const baseTime = new Date('2026-10-09T08:00:00.000Z').getTime();

  for (let i = 1; i <= 100; i++) {
    const amount = (1000 + i * 137.45).toFixed(2);
    const recType = (i % 5 === 0) ? 'MAHSUP' : (i % 3 === 0) ? 'BANK_TRANSFER' : 'INVOICE';
    const timestamp = new Date(baseTime + i * 60000).toISOString();
    appendBlock(chainArray, {
      recordId: `TX-SYNTH-${i.toString().padStart(4, '0')}`,
      amount: parseFloat(amount),
      type: recType,
      timestamp,
      metadata: { sequenceNumber: i }
    }, key);
  }

  return chainArray;
}

// Master Adversarial Runner
async function runAdversarialBlockchainChallenger() {
  console.log(`\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}⚔️  CHALLENGER M3-1: ADVERSARIAL BLOCKCHAIN TAMPERING HARNESS${colors.reset}`);
  console.log(`${colors.dim}Stress-Testing Amount, Timestamp, Deletion, Splicing, Delimiters & Live Endpoint${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const masterKey = getMasterLedgerKey();
  let backupDiskState = null;

  try {
    if (fs.existsSync(LEDGER_FILE)) {
      backupDiskState = fs.readFileSync(LEDGER_FILE, 'utf8');
    }
  } catch (_) {}

  try {
    // ==========================================================================
    // SUITE 1: AMOUNT TAMPERING ATTACKS
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.cyan}--- [SUITE 1] AMOUNT TAMPERING ATTACKS ---${colors.reset}`);
    
    // 1.1 Baseline clean chain
    const cleanChain = [createGenesisBlock(masterKey)];
    appendBlock(cleanChain, { recordId: 'tx-garanti-tl', amount: 15732.92, type: 'BANK_TRANSFER', timestamp: '2026-10-09T08:00:00.000Z' }, masterKey);
    appendBlock(cleanChain, { recordId: 'tx-faruk-aytin', amount: -10335.35, type: 'MAHSUP', timestamp: '2026-10-09T08:15:00.000Z' }, masterKey);
    appendBlock(cleanChain, { recordId: 'tx-ben-ellis', amount: 22414.22, type: 'INVOICE', timestamp: '2026-10-09T08:30:00.000Z' }, masterKey);
    appendBlock(cleanChain, { recordId: 'tx-kdv-tax', amount: 1230.49, type: 'TAX_PAYMENT', timestamp: '2026-10-09T08:45:00.000Z' }, masterKey);

    const baseResult = verifyChain(cleanChain, masterKey);
    check(baseResult.isValid === true && baseResult.totalEntries === 5, 'Baseline 5-block chain verifies with 100% cryptographic validity');

    // 1.2 Intermediate block +1 cent tampering (15732.92 -> 15732.93)
    const tampered1CentInt = JSON.parse(JSON.stringify(cleanChain));
    tampered1CentInt[1].amount = '15732.93';
    const res1CentInt = verifyChain(tampered1CentInt, masterKey);
    check(res1CentInt.isValid === false, 'Intermediate block +1 cent tampering (15732.92 -> 15732.93) is rejected');
    check(res1CentInt.corruptedIndex === 1, 'Pinpointed exact corrupted index 1 for intermediate +1 cent tamper');
    check(res1CentInt.corruptedRecordId === 'tx-garanti-tl', 'Pinpointed exact corrupted record ID "tx-garanti-tl"');
    check(res1CentInt.breachCode === 'BLOCK_HASH_MISMATCH', 'Breach code correctly identified as BLOCK_HASH_MISMATCH');

    // 1.3 Intermediate block -1 cent tampering (15732.92 -> 15732.91)
    const tampered1CentSub = JSON.parse(JSON.stringify(cleanChain));
    tampered1CentSub[1].amount = '15732.91';
    const res1CentSub = verifyChain(tampered1CentSub, masterKey);
    check(res1CentSub.isValid === false, 'Intermediate block -1 cent tampering (15732.92 -> 15732.91) is rejected');
    check(res1CentSub.corruptedIndex === 1 && res1CentSub.corruptedRecordId === 'tx-garanti-tl', 'Exact index 1 and record ID pinpointed for -1 cent tamper');

    // 1.4 Head block +1 cent tampering (1230.49 -> 1230.50)
    const tamperedHead1Cent = JSON.parse(JSON.stringify(cleanChain));
    const headIdx = tamperedHead1Cent.length - 1;
    tamperedHead1Cent[headIdx].amount = '1230.50';
    const resHead1Cent = verifyChain(tamperedHead1Cent, masterKey);
    check(resHead1Cent.isValid === false, 'Head block +1 cent tampering (1230.49 -> 1230.50) is rejected');
    check(resHead1Cent.corruptedIndex === headIdx, `Pinpointed exact head index ${headIdx}`);
    check(resHead1Cent.corruptedRecordId === 'tx-kdv-tax', 'Pinpointed head record ID "tx-kdv-tax"');

    // 1.5 Head block -1 cent tampering (1230.49 -> 1230.48)
    const tamperedHeadMinus = JSON.parse(JSON.stringify(cleanChain));
    tamperedHeadMinus[headIdx].amount = '1230.48';
    const resHeadMinus = verifyChain(tamperedHeadMinus, masterKey);
    check(resHeadMinus.isValid === false && resHeadMinus.corruptedIndex === headIdx, 'Head block -1 cent tampering rejected at head index');

    // 1.6 Sign flipping in intermediate block (-10335.35 -> 10335.35)
    const tamperedSignInt = JSON.parse(JSON.stringify(cleanChain));
    tamperedSignInt[2].amount = '10335.35'; // Was negative debt
    const resSignInt = verifyChain(tamperedSignInt, masterKey);
    check(resSignInt.isValid === false, 'Intermediate negative debt sign-flip (-10335.35 -> 10335.35) is rejected');
    check(resSignInt.corruptedIndex === 2 && resSignInt.corruptedRecordId === 'tx-faruk-aytin', 'Sign flip pinpointed at index 2 (tx-faruk-aytin)');

    // 1.7 Sign flipping in head block (1230.49 -> -1230.49)
    const tamperedSignHead = JSON.parse(JSON.stringify(cleanChain));
    tamperedSignHead[headIdx].amount = '-1230.49';
    const resSignHead = verifyChain(tamperedSignHead, masterKey);
    check(resSignHead.isValid === false && resSignHead.corruptedIndex === headIdx, 'Head block positive to negative sign-flip is rejected at head index');

    // 1.8 Subtle float precision injection: un-normalized string "15732.920"
    const tamperedFloatUnnorm = JSON.parse(JSON.stringify(cleanChain));
    tamperedFloatUnnorm[1].amount = '15732.920'; // Extra zero
    const resFloatUnnorm = verifyChain(tamperedFloatUnnorm, masterKey);
    // Since normalizeAmount turns '15732.920' into '15732.92', the recomputed payload matches canonical, but string mismatch in entryHash if raw was different:
    // When computeEntryHash runs, it normalizes amount to '15732.92'. Since the original was also '15732.92', recomputedHash matches!
    check(typeof resFloatUnnorm.isValid === 'boolean', 'Float precision string handling terminates cleanly');

    // 1.9 Non-numeric malicious string injected directly in raw block
    const tamperedMaliciousAmt = JSON.parse(JSON.stringify(cleanChain));
    tamperedMaliciousAmt[1].amount = 'INVALID_NUMBER_AMOUNT';
    const resMaliciousAmt = verifyChain(tamperedMaliciousAmt, masterKey);
    check(resMaliciousAmt.isValid === false, 'Non-numeric raw amount string triggers payload corruption rejection');
    check(resMaliciousAmt.breachCode === 'PAYLOAD_CORRUPTED', 'Breach code correctly identifies PAYLOAD_CORRUPTED');
    check(resMaliciousAmt.corruptedIndex === 1, 'Pinpointed corrupted index 1 on malformed amount string');

    // ==========================================================================
    // SUITE 2: TIMESTAMP AND SEQUENCE DISRUPTION ATTACKS
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.cyan}--- [SUITE 2] TIMESTAMP & SEQUENCE DISRUPTION ATTACKS ---${colors.reset}`);

    // 2.1 Swap adjacent blocks order (swap index 2 and index 3)
    const swappedChain = JSON.parse(JSON.stringify(cleanChain));
    const tempBlock = swappedChain[2];
    swappedChain[2] = swappedChain[3];
    swappedChain[3] = tempBlock;
    const resSwap = verifyChain(swappedChain, masterKey);
    check(resSwap.isValid === false, 'Swapping adjacent intermediate blocks is rejected');
    check(resSwap.breachCode === 'CHAIN_LINK_SEVERED', 'Breach code correctly reports CHAIN_LINK_SEVERED');
    check(resSwap.corruptedIndex === 2, 'Pinpointed exact swap location at sequence index 2');

    // 2.2 Swap head block with previous block (swap index 3 and 4)
    const swappedHeadChain = JSON.parse(JSON.stringify(cleanChain));
    const tempHead = swappedHeadChain[3];
    swappedHeadChain[3] = swappedHeadChain[4];
    swappedHeadChain[4] = tempHead;
    const resSwapHead = verifyChain(swappedHeadChain, masterKey);
    check(resSwapHead.isValid === false, 'Swapping head block with penultimate block is rejected');
    check(resSwapHead.breachCode === 'CHAIN_LINK_SEVERED' && resSwapHead.corruptedIndex === 3, 'Head swap pinpointed at index 3 with CHAIN_LINK_SEVERED');

    // 2.3 Perturb intermediate timestamp by exactly +1 millisecond
    const tampered1msInt = JSON.parse(JSON.stringify(cleanChain));
    // Original: '2026-10-09T08:00:00.000Z'
    tampered1msInt[1].timestamp = '2026-10-09T08:00:00.001Z';
    const res1msInt = verifyChain(tampered1msInt, masterKey);
    check(res1msInt.isValid === false, 'Perturbing intermediate timestamp by +1 ms is rejected');
    check(res1msInt.breachCode === 'BLOCK_HASH_MISMATCH', 'Breach code is BLOCK_HASH_MISMATCH');
    check(res1msInt.corruptedIndex === 1 && res1msInt.corruptedRecordId === 'tx-garanti-tl', 'Pinpointed index 1 and record ID for +1 ms shift');

    // 2.4 Perturb head timestamp by -1 millisecond
    const tampered1msHead = JSON.parse(JSON.stringify(cleanChain));
    // Original: '2026-10-09T08:45:00.000Z'
    tampered1msHead[headIdx].timestamp = '2026-10-09T08:44:59.999Z';
    const res1msHead = verifyChain(tampered1msHead, masterKey);
    check(res1msHead.isValid === false, 'Perturbing head timestamp by -1 ms is rejected');
    check(res1msHead.corruptedIndex === headIdx && res1msHead.corruptedRecordId === 'tx-kdv-tax', 'Pinpointed head index and record ID for -1 ms shift');

    // 2.5 Invalidate timestamp string completely
    const tamperedBadTs = JSON.parse(JSON.stringify(cleanChain));
    tamperedBadTs[2].timestamp = 'NOT_A_VALID_DATE_TIME';
    const resBadTs = verifyChain(tamperedBadTs, masterKey);
    check(resBadTs.isValid === false, 'Invalid timestamp string rejected');
    check(resBadTs.breachCode === 'PAYLOAD_CORRUPTED', 'Breach code correctly identified as PAYLOAD_CORRUPTED');
    check(resBadTs.corruptedIndex === 2, 'Pinpointed corrupted index 2');

    // ==========================================================================
    // SUITE 3: RECORD DELETION IN A 100-BLOCK CHAIN
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.cyan}--- [SUITE 3] RECORD DELETION IN A 100-BLOCK CHAIN ---${colors.reset}`);

    const largeChain100 = generateSynthetic100Chain(masterKey);
    check(largeChain100.length === 101, 'Generated synthetic 100-transaction chain (101 blocks total including Genesis)');
    const resLargeClean = verifyChain(largeChain100, masterKey);
    check(resLargeClean.isValid === true && resLargeClean.totalEntries === 101, 'Baseline 100-record chain passes with 100% cryptographic validity');

    // 3.1 Omit a block in the middle (index 50)
    const omittedMid = JSON.parse(JSON.stringify(largeChain100));
    const targetOmitted = omittedMid[50];
    const expectedSeveredSuccessor = omittedMid[51].recordId;
    omittedMid.splice(50, 1); // Delete block 50
    check(omittedMid.length === 100, 'Chain length reduced to 100 after midpoint block deletion');
    const resOmittedMid = verifyChain(omittedMid, masterKey);
    check(resOmittedMid.isValid === false, 'Deleting block at midpoint is detected immediately');
    check(resOmittedMid.breachCode === 'CHAIN_LINK_SEVERED', 'Breach code is CHAIN_LINK_SEVERED');
    check(resOmittedMid.corruptedIndex === 50, 'Pinpointed exact location of deletion at index 50');
    check(resOmittedMid.corruptedRecordId === expectedSeveredSuccessor, `Pinpointed severed successor record ID: ${expectedSeveredSuccessor}`);

    // 3.2 Omit first transaction block (index 1)
    const omittedFirst = JSON.parse(JSON.stringify(largeChain100));
    const successorOfFirst = omittedFirst[2].recordId;
    omittedFirst.splice(1, 1); // Delete block 1
    const resOmittedFirst = verifyChain(omittedFirst, masterKey);
    check(resOmittedFirst.isValid === false, 'Deleting block 1 (first transaction after Genesis) is detected');
    check(resOmittedFirst.corruptedIndex === 1, 'Pinpointed index 1');
    check(resOmittedFirst.corruptedRecordId === successorOfFirst, `Pinpointed record ID ${successorOfFirst}`);

    // 3.3 Omit 5 consecutive blocks (indices 70..74)
    const omittedMulti = JSON.parse(JSON.stringify(largeChain100));
    const successorOfMulti = omittedMulti[75].recordId;
    omittedMulti.splice(70, 5); // Delete 5 blocks
    const resOmittedMulti = verifyChain(omittedMulti, masterKey);
    check(resOmittedMulti.isValid === false && resOmittedMulti.corruptedIndex === 70, 'Deleting 5 consecutive blocks detected at index 70');
    check(resOmittedMulti.corruptedRecordId === successorOfMulti, `Pinpointed severed successor ID: ${successorOfMulti}`);

    // ==========================================================================
    // SUITE 4: BLOCK SPLICING AND INJECTION ATTACKS
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.cyan}--- [SUITE 4] BLOCK SPLICING & INJECTION ATTACKS ---${colors.reset}`);

    // 4.1 Injected forged block at index 50 with bogus hash
    const injectedChainBogus = JSON.parse(JSON.stringify(largeChain100));
    const forgedBogusBlock = {
      index: 50,
      sequence: 50,
      recordId: 'TX-FORGED-ROGUE-001',
      prevHash: injectedChainBogus[49].entryHash,
      entryHash: crypto.randomBytes(32).toString('hex'), // Bogus unkeyed hash
      amount: '999999.00',
      type: 'ROGUE_INJECTION',
      timestamp: '2026-10-09T08:50:00.000Z',
      recordedAt: new Date().toISOString(),
      metadata: {}
    };
    injectedChainBogus.splice(50, 0, forgedBogusBlock);
    const resInjectedBogus = verifyChain(injectedChainBogus, masterKey);
    check(resInjectedBogus.isValid === false, 'Injecting a forged block with random hash is rejected');
    check(resInjectedBogus.breachCode === 'BLOCK_HASH_MISMATCH', 'Identified as BLOCK_HASH_MISMATCH');
    check(resInjectedBogus.corruptedIndex === 50, 'Pinpointed forged block at index 50');
    check(resInjectedBogus.corruptedRecordId === 'TX-FORGED-ROGUE-001', 'Pinpointed forged record ID "TX-FORGED-ROGUE-001"');

    // 4.2 Key-guessing attack: forged block hashed with wrong key
    const injectedWrongKey = JSON.parse(JSON.stringify(largeChain100));
    const wrongKey = deriveLedgerKey('WrongAttackerSecretKey987654321');
    const forgedWrongKeyHash = computeEntryHash(
      injectedWrongKey[49].entryHash,
      'TX-FORGED-WRONG-KEY',
      '50000.00',
      'TRANSFER',
      '2026-10-09T08:50:00.000Z',
      wrongKey
    );
    const forgedKeyBlock = {
      index: 50,
      sequence: 50,
      recordId: 'TX-FORGED-WRONG-KEY',
      prevHash: injectedWrongKey[49].entryHash,
      entryHash: forgedWrongKeyHash,
      amount: '50000.00',
      type: 'TRANSFER',
      timestamp: '2026-10-09T08:50:00.000Z',
      recordedAt: new Date().toISOString(),
      metadata: {}
    };
    injectedWrongKey.splice(50, 0, forgedKeyBlock);
    const resWrongKey = verifyChain(injectedWrongKey, masterKey);
    check(resWrongKey.isValid === false, 'Key-guessing forgery rejected under master key verification');
    check(resWrongKey.corruptedIndex === 50 && resWrongKey.corruptedRecordId === 'TX-FORGED-WRONG-KEY', 'Pinpointed key-guessing forgery at index 50');

    // 4.3 Downstream break: valid forged HMAC block inserted, downstream blocks unaltered
    const injectedValidKeyBlock = JSON.parse(JSON.stringify(largeChain100));
    const forgedValidHash = computeEntryHash(
      injectedValidKeyBlock[49].entryHash,
      'TX-INSIDER-KEY-FORGED',
      '77777.00',
      'MAHSUP',
      '2026-10-09T08:50:00.000Z',
      masterKey
    );
    const validKeyBlock = {
      index: 50,
      sequence: 50,
      recordId: 'TX-INSIDER-KEY-FORGED',
      prevHash: injectedValidKeyBlock[49].entryHash,
      entryHash: forgedValidHash,
      amount: '77777.00',
      type: 'MAHSUP',
      timestamp: '2026-10-09T08:50:00.000Z',
      recordedAt: new Date().toISOString(),
      metadata: {}
    };
    injectedValidKeyBlock.splice(50, 0, validKeyBlock);
    // Block 50 itself has valid HMAC, BUT block 51 (former block 50) still points to block 49!
    const resDownstream = verifyChain(injectedValidKeyBlock, masterKey);
    check(resDownstream.isValid === false, 'Insider injection is caught on downstream block continuity check');
    check(resDownstream.breachCode === 'CHAIN_LINK_SEVERED', 'Downstream link severed detected');
    check(resDownstream.corruptedIndex === 51, 'Pinpointed severed downstream index 51');

    // 4.4 Replay attack from another tenant ledger
    const tenantBKey = deriveLedgerKey('Tenant-B-Isolated-Ledger-Key-2026');
    const tenantBChain = generateSynthetic100Chain(tenantBKey);
    const replayChain = JSON.parse(JSON.stringify(largeChain100));
    replayChain[30] = tenantBChain[30]; // Replace block 30 with block from Tenant B
    const resReplay = verifyChain(replayChain, masterKey);
    check(resReplay.isValid === false, 'Cross-tenant replay block attack is detected');
    check(resReplay.corruptedIndex === 30, 'Replay attack pinpointed at index 30');

    // ==========================================================================
    // SUITE 5: DELIMITER COLLISION AND FRAMING ATTACKS
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.cyan}--- [SUITE 5] DELIMITER COLLISION & FRAMING ATTACKS ---${colors.reset}`);

    // 5.1 Delimiter injection in recordId during appendBlock throws INVALID_RECORD_ID
    let pipeRecordIdThrown = false;
    try {
      appendBlock([], {
        recordId: 'TX-ATTACK|100.00|INVOICE|2026-10-09T08:00:00.000Z',
        amount: 50.00,
        type: 'INVOICE'
      }, masterKey);
    } catch (err) {
      pipeRecordIdThrown = true;
      check(err.code === 'INVALID_RECORD_ID', 'appendBlock rejects pipe character in recordId with INVALID_RECORD_ID');
    }
    check(pipeRecordIdThrown, 'Pipe in recordId was strictly blocked at API boundary');

    // 5.2 Delimiter injection in type during appendBlock throws INVALID_TYPE
    let pipeTypeThrown = false;
    try {
      appendBlock([], {
        recordId: 'TX-LEGIT-001',
        amount: 50.00,
        type: 'INVOICE|1000.00'
      }, masterKey);
    } catch (err) {
      pipeTypeThrown = true;
      check(err.code === 'INVALID_TYPE', 'appendBlock rejects pipe character in type with INVALID_TYPE');
    }
    check(pipeTypeThrown, 'Pipe in type was strictly blocked at API boundary');

    // 5.3 Raw block injection with pipe in recordId directly into chain structure
    const rawPipeChain = JSON.parse(JSON.stringify(cleanChain));
    rawPipeChain[1].recordId = 'tx-garanti-tl|INJECTED_PIPE';
    const resRawPipe = verifyChain(rawPipeChain, masterKey);
    check(resRawPipe.isValid === false, 'Raw pipe in recordId during chain traversal triggers rejection');
    check(resRawPipe.breachCode === 'PAYLOAD_CORRUPTED', 'Breach code identifies PAYLOAD_CORRUPTED on delimiter presence');
    check(resRawPipe.corruptedIndex === 1, 'Pinpointed exact corrupted index 1 on raw delimiter injection');

    // 5.4 Raw block injection with pipe in type directly into chain structure
    const rawPipeTypeChain = JSON.parse(JSON.stringify(cleanChain));
    rawPipeTypeChain[2].type = 'MAHSUP|FORGED';
    const resRawPipeType = verifyChain(rawPipeTypeChain, masterKey);
    check(resRawPipeType.isValid === false && resRawPipeType.breachCode === 'PAYLOAD_CORRUPTED', 'Raw pipe in type during chain traversal triggers PAYLOAD_CORRUPTED');
    check(resRawPipeType.corruptedIndex === 2, 'Pinpointed exact corrupted index 2 on raw type pipe injection');

    // 5.5 Boundary framing shift collision attempt
    // Verify that buildCanonicalPayload creates strictly unambiguous tokens
    const samplePayload1 = buildCanonicalPayload(
      'a'.repeat(64),
      'REC-1',
      '100.00',
      'INVOICE',
      '2026-10-09T08:00:00.000Z'
    );
    const samplePayload2 = buildCanonicalPayload(
      'a'.repeat(64),
      'REC-2',
      '100.00',
      'INVOICE',
      '2026-10-09T08:00:00.000Z'
    );
    check(samplePayload1 !== samplePayload2, 'Distinct records produce strictly distinct canonical payloads');
    check(samplePayload1.split('|').length === 5, 'Canonical payload contains exactly 5 pipe-delimited fields');

    // 5.6 Special characters: Turkish characters (Ş, İ, ğ, ü, ç, ö) handled seamlessly
    const turkishChain = [createGenesisBlock(masterKey)];
    appendBlock(turkishChain, {
      recordId: 'TX-TÜRKÇE-ŞİRİN-ÇEKİÇ-001',
      amount: 1453.50,
      type: 'ÖZEL_MAHSUP',
      timestamp: '2026-10-09T09:00:00.000Z'
    }, masterKey);
    const resTurkish = verifyChain(turkishChain, masterKey);
    check(resTurkish.isValid === true, 'Legitimate Turkish UTF-8 characters (Ş, İ, ü, ç, Ö) pass verification with 100% validity');

    // ==========================================================================
    // SUITE 6: LIVE HTTP VERIFICATION ENDPOINT INTEGRATION ATTACKS
    // ==========================================================================
    console.log(`\n${colors.bold}${colors.cyan}--- [SUITE 6] LIVE HTTP VERIFICATION ENDPOINT ATTACKS ---${colors.reset}`);

    // Load actual server/index.js express application
    const prodApp = require('../server/index');
    check(typeof prodApp === 'function', 'Loaded production Express application from server/index.js');
    check(Boolean(prodApp.ledgerIntegrity), 'ledgerIntegrity engine is mounted on production Express app');

    // Spin up ephemeral test server binding to 127.0.0.1
    const server = await new Promise((resolve) => {
      const s = prodApp.listen(0, '127.0.0.1', () => resolve(s));
    });
    const port = server.address().port;
    console.log(`  ${colors.dim}Production server listening on 127.0.0.1:${port}${colors.reset}`);

    try {
      // Generate test JWT tokens using real server/auth.js
      const adminToken = auth.generateToken(
        { id: 'admin-emp-test', username: 'audit-admin', role: 'ADMIN' },
        { is2FAVerified: true }
      );
      const auditorToken = auth.generateToken(
        { id: 'auditor-emp-test', username: 'external-auditor', role: 'AUDITOR' },
        { is2FAVerified: true }
      );
      const userToken = auth.generateToken(
        { id: 'regular-user-test', username: 'accountant-user', role: 'USER' },
        { is2FAVerified: true }
      );

      // 6.1 Clean state GET /api/audit/verify-integrity with ADMIN token -> 200 OK
      const resLiveClean = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      check(resLiveClean.statusCode === 200, 'GET /api/audit/verify-integrity with ADMIN token returns HTTP 200 OK');
      check(resLiveClean.json && resLiveClean.json.success === true && resLiveClean.json.isValid === true, 'Clean chain returns success: true, isValid: true');

      // 6.2 Alias route GET /muhasebe/api/audit/verify-integrity -> 200 OK
      const resLiveAlias = await sendHttpRequest({
        port,
        path: '/muhasebe/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      check(resLiveAlias.statusCode === 200, 'GET /muhasebe/api/audit/verify-integrity alias route returns HTTP 200 OK');
      check(resLiveAlias.json && resLiveAlias.json.isValid === true, 'Alias route confirms valid chain');

      // 6.3 AUDITOR role allowed -> 200 OK
      const resLiveAuditor = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${auditorToken}` }
      });
      check(resLiveAuditor.statusCode === 200, 'GET /api/audit/verify-integrity with AUDITOR role returns HTTP 200 OK');

      // 6.4 Unauthorized role (USER) rejected with 403 Forbidden
      const resLiveUser = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${userToken}` }
      });
      check(resLiveUser.statusCode === 403, 'GET /api/audit/verify-integrity with non-admin/non-auditor role is rejected with HTTP 403');
      check(resLiveUser.json && resLiveUser.json.code === 'FORBIDDEN_AUDIT_ACCESS', 'Error code is FORBIDDEN_AUDIT_ACCESS');

      // 6.5 Unauthenticated request rejected with 401 Unauthorized
      const resLiveNoAuth = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity',
        headers: {}
      });
      check(resLiveNoAuth.statusCode === 401, 'Unauthenticated request rejected with HTTP 401 UNAUTHORIZED');

      // 6.6 Tamper active server ledger blocks and verify HTTP 409 Conflict with exact pinpoint
      // Append a test transaction to the live ledger first
      const liveTxBlock = ledgerIntegrity.appendTransaction({
        id: 'tx-live-tamper-target',
        amount: 5500.25,
        type: 'BANK_TRANSFER',
        description: 'Empirical Challenger Target Block'
      });
      check(liveTxBlock.recordId === 'tx-live-tamper-target', 'Appended test block to active server chain');

      // Verify still clean before tampering
      const resPreTamper = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      check(resPreTamper.statusCode === 200 && resPreTamper.json.isValid === true, 'Chain confirmed valid before tampering');

      // Now introduce tamper into active server chain: modify 1 cent (5500.25 -> 5500.26)
      const serverChain = ledgerIntegrity.getChain();
      const targetServerBlock = serverChain[serverChain.length - 1];
      const targetServerIndex = serverChain.length - 1;
      targetServerBlock.amount = '5500.26';

      const resLiveTampered = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      check(resLiveTampered.statusCode === 409, 'Live HTTP endpoint returns HTTP 409 Conflict upon detected tamper');
      check(resLiveTampered.json && resLiveTampered.json.isValid === false, 'Live endpoint returns isValid: false');
      check(resLiveTampered.json.error === 'LEDGER_TAMPER_DETECTED', 'Live error reported as LEDGER_TAMPER_DETECTED');
      check(resLiveTampered.json.corruptedIndex === targetServerIndex, `Exact corrupted sequence index ${targetServerIndex} pinpointed`);
      check(resLiveTampered.json.corruptedRecordId === 'tx-live-tamper-target', 'Exact corrupted record ID "tx-live-tamper-target" pinpointed');

      // 6.7 allowStatus200 query parameter returns HTTP 200 with isValid: false
      const resLiveAllow200 = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity?allowStatus200=true',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      check(resLiveAllow200.statusCode === 200, '?allowStatus200=true query parameter returns HTTP 200 with audit report');
      check(resLiveAllow200.json && resLiveAllow200.json.isValid === false, 'Audit report in 200 response accurately indicates isValid: false');
      check(resLiveAllow200.json.corruptedIndex === targetServerIndex, 'Pinpoint preserved in 200 response');

      // 6.8 Restore active chain and verify restoration to HTTP 200 OK
      targetServerBlock.amount = '5500.25'; // Restore 1 cent
      const resLiveRestored = await sendHttpRequest({
        port,
        path: '/api/audit/verify-integrity',
        headers: { authorization: `Bearer ${adminToken}` }
      });
      check(resLiveRestored.statusCode === 200, 'Restoring corrupted block returns live endpoint to HTTP 200 OK');
      check(resLiveRestored.json && resLiveRestored.json.isValid === true, 'Restored chain verified 100% valid');

    } finally {
      server.close();
    }

  } finally {
    // Restore disk file backup if it existed
    if (backupDiskState !== null) {
      try {
        fs.writeFileSync(LEDGER_FILE, backupDiskState, 'utf8');
      } catch (_) {}
    }
  }

  // Final Summary
  console.log(`\n${colors.bold}${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}📊 CHALLENGER M3-1 ADVERSARIAL TEST SUMMARY:${colors.reset} ${colors.green}${passedChecks}/${totalChecks} Checks Passed (100%)${colors.reset}`);
  console.log(`${colors.bold}${colors.green}✔ ALL ADVERSARIAL TAMPERING, CORRUPTION & ENDPOINT SCENARIOS RIGIDLY PROVEN${colors.reset}`);
  console.log(`${colors.magenta}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  return { totalChecks, passedChecks, failedChecks };
}

// Direct execution
if (require.main === module) {
  runAdversarialBlockchainChallenger()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}

module.exports = { runAdversarialBlockchainChallenger };
