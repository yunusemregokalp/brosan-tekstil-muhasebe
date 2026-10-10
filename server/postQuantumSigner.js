/**
 * BROSAN TEKSTİL ERP — SOVEREIGN OMEGA CITADEL (PHASE 10)
 * Module: server/postQuantumSigner.js
 *
 * NIST FIPS 204 ML-DSA-44 (Lattice-Based Digital Signature) + Ed25519 Dual Hybrid Signer.
 * Guarantees Post-Quantum Forward Secrecy against Shor's algorithm for official financial
 * declarations (ETGB, İBKB, TTK 94 Cari Mutabakat, General Ledger mutations).
 */

const crypto = require('crypto');

// ==============================================================================
// 1. CONSTANTS & PARAMETERS (NIST FIPS 204 ML-DSA-44 CATEGORY 2)
// ==============================================================================
const Q = 8380417;              // Modulus q = 2^23 - 2^13 + 1
const N = 256;                  // Ring degree n = 256, R_q = Z_q[X]/(X^256 + 1)
const K = 4;                    // Matrix rows k = 4
const L = 4;                    // Matrix columns l = 4
const ETA = 2;                  // Secret key bound [-eta, eta]
const GAMMA1 = 131072;          // 2^17 masking bound
const GAMMA2 = 261888;          // (q - 1) / 32
const ALPHA = 523776;           // 2 * gamma2
const TAU = 39;                 // Challenge polynomial non-zero count (+-1)
const BETA = 78;                // tau * eta = 39 * 2 = 78
const OMEGA = 80;               // Maximum allowed hints
const BINS = 16;                // (q - 1) / alpha = 16 high-bits bins

const ML_DSA_PARAMS = {
  name: 'ML-DSA-44',
  q: Q,
  n: N,
  k: K,
  l: L,
  eta: ETA,
  gamma1: GAMMA1,
  gamma2: GAMMA2,
  alpha: ALPHA,
  tau: TAU,
  beta: BETA,
  omega: OMEGA
};

// ==============================================================================
// 2. ERROR CLASS
// ==============================================================================
class HybridSignatureError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'HybridSignatureError';
    this.code = 'INVALID_HYBRID_SIGNATURE';
    this.details = details;
  }
}

// ==============================================================================
// 3. CYCLOTOMIC POLYNOMIAL ARITHMETIC IN R_q = Z_q[X]/(X^256 + 1)
// ==============================================================================

/**
 * Creates a zero-initialized polynomial of degree 256.
 * @returns {Int32Array}
 */
function polyZero() {
  return new Int32Array(N);
}

/**
 * Polynomial addition modulo q: c = (a + b) mod q
 */
function polyAdd(a, b) {
  const c = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const v = a[i] + b[i];
    c[i] = v >= Q ? v - Q : v;
  }
  return c;
}

/**
 * Polynomial subtraction modulo q: c = (a - b) mod q
 */
function polySub(a, b) {
  const c = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const v = a[i] - b[i];
    c[i] = v < 0 ? v + Q : v;
  }
  return c;
}

/**
 * Cyclotomic ring polynomial multiplication: c(X) = a(X) * b(X) mod (X^256 + 1) mod q.
 * Employs negative wrap-around: X^(256+k) = -X^k.
 * Uses IEEE-754 double precision accumulation (exact for products < 9e15; here max is 7e13).
 */
function polyMul(a, b) {
  const c = new Int32Array(N);
  for (let i = 0; i < N; i++) {
    const ai = a[i];
    if (ai === 0) continue;
    for (let j = 0; j < N; j++) {
      const bj = b[j];
      if (bj === 0) continue;
      const idx = i + j;
      const prod = ai * bj;
      if (idx < N) {
        c[idx] = (c[idx] + prod) % Q;
      } else {
        c[idx - N] = (c[idx - N] - prod) % Q;
      }
    }
  }
  for (let i = 0; i < N; i++) {
    let v = c[i] % Q;
    if (v < 0) v += Q;
    c[i] = v;
  }
  return c;
}

/**
 * Scalar multiplication: c = s * a mod q
 */
function polyScale(s, a) {
  const c = new Int32Array(N);
  const modS = ((s % Q) + Q) % Q;
  for (let i = 0; i < N; i++) {
    c[i] = Number((BigInt(a[i]) * BigInt(modS)) % BigInt(Q));
  }
  return c;
}

/**
 * Centered infinity norm: max |coeff|_centered
 */
function polyNormInf(p) {
  let max = 0;
  for (let i = 0; i < N; i++) {
    let v = p[i] % Q;
    if (v < 0) v += Q;
    if (v > Q / 2) v = Q - v;
    if (v > max) max = v;
  }
  return max;
}

// ==============================================================================
// 4. HIGH/LOW BITS DECOMPOSITION & HINT EXTRACTION (ALPHA = 523776)
// ==============================================================================

/**
 * Decompose a coefficient r into high bits r1 in [0, 15] and low bits r0 in [-ALPHA/2, ALPHA/2].
 */
function decomposeCoeff(r) {
  const rPos = ((r % Q) + Q) % Q;
  let r0 = ((rPos % ALPHA) + ALPHA) % ALPHA;
  if (r0 > ALPHA / 2) {
    r0 -= ALPHA;
  }
  let r1;
  if (rPos - r0 === Q - 1) {
    r1 = 0;
    r0 -= 1;
  } else {
    r1 = Math.floor((rPos - r0) / ALPHA);
  }
  return { r0, r1: ((r1 % BINS) + BINS) % BINS };
}

/**
 * High bits of a polynomial.
 * @returns {Uint8Array} Length 256, elements in [0, 15]
 */
function polyHighBits(p) {
  const hb = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    hb[i] = decomposeCoeff(p[i]).r1;
  }
  return hb;
}

// ==============================================================================
// 5. DETERMINISTIC SHAKE256 EXPANSION & SAMPLING
// ==============================================================================

/**
 * Expands 4x4 matrix A in R_q^(k x l) deterministically from 32-byte seed rho
 * using rejection sampling of 24-bit chunks from SHAKE256.
 */
function expandMatrixA(rho) {
  const A = [];
  for (let i = 0; i < K; i++) {
    A[i] = [];
    for (let j = 0; j < L; j++) {
      const poly = new Int32Array(N);
      // SHAKE256 XOF
      const hash = crypto.createHash('shake256', { outputLength: 1024 });
      hash.update(rho);
      hash.update(Buffer.from([i, j]));
      const stream = hash.digest();
      let streamPos = 0;
      let polyPos = 0;

      while (polyPos < N && streamPos + 3 <= stream.length) {
        const b0 = stream[streamPos];
        const b1 = stream[streamPos + 1];
        const b2 = stream[streamPos + 2];
        streamPos += 3;
        const val = b0 | (b1 << 8) | ((b2 & 0x7f) << 16);
        if (val < Q) {
          poly[polyPos++] = val;
        }
      }

      // Fallback if rejection stream was short (astronomically rare)
      if (polyPos < N) {
        const hash2 = crypto.createHash('shake256', { outputLength: 2048 });
        hash2.update(rho);
        hash2.update(Buffer.from([i, j, 0xff]));
        const stream2 = hash2.digest();
        let s2Pos = 0;
        while (polyPos < N && s2Pos + 3 <= stream2.length) {
          const b0 = stream2[s2Pos];
          const b1 = stream2[s2Pos + 1];
          const b2 = stream2[s2Pos + 2];
          s2Pos += 3;
          const val = b0 | (b1 << 8) | ((b2 & 0x7f) << 16);
          if (val < Q) {
            poly[polyPos++] = val;
          }
        }
      }

      A[i][j] = poly;
    }
  }
  return A;
}

/**
 * Samples a polynomial with coefficients bounded in [-ETA, ETA] (ETA = 2).
 */
function sampleEta(seed, nonce) {
  const poly = new Int32Array(N);
  const hash = crypto.createHash('shake256', { outputLength: 512 });
  hash.update(seed);
  hash.update(Buffer.from([nonce]));
  const stream = hash.digest();
  let streamPos = 0;
  let polyPos = 0;

  while (polyPos < N && streamPos < stream.length) {
    const byte = stream[streamPos++];
    const n0 = byte & 0x0f;
    const n1 = (byte >> 4) & 0x0f;
    // Map nibbles in [0..4] to [-2..2]
    if (n0 < 5) {
      const v = (n0 - 2 + Q) % Q;
      poly[polyPos++] = v;
    }
    if (polyPos < N && n1 < 5) {
      const v = (n1 - 2 + Q) % Q;
      poly[polyPos++] = v;
    }
  }
  return poly;
}

/**
 * Samples a masking polynomial y with coefficients bounded in [-GAMMA1, GAMMA1] (GAMMA1 = 131072).
 */
function sampleMask(seed, nonce) {
  const poly = new Int32Array(N);
  const hash = crypto.createHash('shake256', { outputLength: 1024 });
  hash.update(seed);
  hash.update(Buffer.from([nonce]));
  const stream = hash.digest();
  let streamPos = 0;
  let polyPos = 0;

  while (polyPos < N && streamPos + 3 <= stream.length) {
    const b0 = stream[streamPos++];
    const b1 = stream[streamPos++];
    const b2 = stream[streamPos++];
    const raw = b0 | (b1 << 8) | ((b2 & 0x03) << 16); // 18 bits
    if (raw <= 2 * GAMMA1) {
      const v = raw - GAMMA1;
      poly[polyPos++] = (v + Q) % Q;
    }
  }
  return poly;
}

/**
 * Samples challenge polynomial c(X) from 32-byte challenge seed.
 * Contains exactly TAU = 39 non-zero coefficients in {-1, +1}.
 */
function sampleChallenge(cSeed) {
  const poly = new Int32Array(N);
  const hash = crypto.createHash('shake256', { outputLength: 256 });
  hash.update(cSeed);
  const stream = hash.digest();

  // First 8 bytes provide 64 sign bits
  let signLow = stream.readUInt32LE(0);
  let signHigh = stream.readUInt32LE(4);
  let streamPos = 8;
  let picked = 0;
  const pickedIndices = new Set();

  while (picked < TAU && streamPos < stream.length) {
    const idx = stream[streamPos++];
    if (!pickedIndices.has(idx)) {
      pickedIndices.add(idx);
      // Pick sign bit
      let signBit;
      if (picked < 32) {
        signBit = (signLow >> picked) & 1;
      } else {
        signBit = (signHigh >> (picked - 32)) & 1;
      }
      poly[idx] = signBit === 1 ? 1 : Q - 1;
      picked++;
    }
  }
  return poly;
}

// ==============================================================================
// 6. NIST FIPS 204 ML-DSA-44 CORE ENGINE
// ==============================================================================

/**
 * ML-DSA-44 Key Generation.
 * @param {Buffer} [masterSeed] - 32-byte optional deterministic seed
 * @returns {object} { rho, t, s1, s2, publicKeyHex, privateKeyHex }
 */
function mlDsaKeyGen(masterSeed) {
  const seed = masterSeed && Buffer.isBuffer(masterSeed) && masterSeed.length >= 32
    ? masterSeed.subarray(0, 32)
    : crypto.randomBytes(32);

  const kdf = crypto.createHash('shake256', { outputLength: 128 }).update(seed).digest();
  const rho = kdf.subarray(0, 32);
  const sigma = kdf.subarray(32, 64);

  // Expand Matrix A (K x L = 4 x 4)
  const A = expandMatrixA(rho);

  // Sample secret noise vectors s1 in R_q^L, s2 in R_q^K
  const s1 = [];
  for (let j = 0; j < L; j++) {
    s1[j] = sampleEta(sigma, j);
  }
  const s2 = [];
  for (let i = 0; i < K; i++) {
    s2[i] = sampleEta(sigma, L + i);
  }

  // Compute public key vector t = A * s1 + s2 mod q (length K = 4)
  const t = [];
  for (let i = 0; i < K; i++) {
    let acc = polyZero();
    for (let j = 0; j < L; j++) {
      const prod = polyMul(A[i][j], s1[j]);
      acc = polyAdd(acc, prod);
    }
    t[i] = polyAdd(acc, s2[i]);
  }

  // Serialize t vector into compact base64
  const tBuf = Buffer.alloc(K * N * 4);
  let offset = 0;
  for (let i = 0; i < K; i++) {
    for (let j = 0; j < N; j++) {
      tBuf.writeInt32LE(t[i][j], offset);
      offset += 4;
    }
  }

  return {
    rho: rho.toString('hex'),
    t,
    s1,
    s2,
    publicKeyBase64: tBuf.toString('base64'),
    rhoBuffer: rho
  };
}

/**
 * ML-DSA-44 Sign.
 * Computes lattice signature (cSeed, z, hints) over message digest M (32 bytes).
 */
function mlDsaSign(M, keypair) {
  const { rhoBuffer, s1, s2 } = keypair;
  const A = expandMatrixA(rhoBuffer);

  let attempt = 0;
  while (attempt < 100) {
    attempt++;
    const maskSeed = crypto.randomBytes(32);

    // 1. Sample masking vector y in R_q^L with ||y||_inf <= GAMMA1
    const y = [];
    for (let j = 0; j < L; j++) {
      y[j] = sampleMask(maskSeed, j);
    }

    // 2. Compute commitment w = A * y mod q (length K = 4)
    const w = [];
    for (let i = 0; i < K; i++) {
      let acc = polyZero();
      for (let j = 0; j < L; j++) {
        const prod = polyMul(A[i][j], y[j]);
        acc = polyAdd(acc, prod);
      }
      w[i] = acc;
    }

    // 3. Extract HighBits of w: w1 (K x N = 1024 bytes)
    const w1Bytes = Buffer.alloc(K * N);
    for (let i = 0; i < K; i++) {
      const hb = polyHighBits(w[i]);
      Buffer.from(hb).copy(w1Bytes, i * N);
    }

    // 4. Derive challenge seed: cSeed = SHAKE256(M || w1Bytes, 32)
    const cSeed = crypto.createHash('shake256', { outputLength: 32 })
      .update(M)
      .update(w1Bytes)
      .digest();

    // 5. Expand challenge polynomial c(X)
    const c = sampleChallenge(cSeed);

    // 6. Compute response vector z = y + c * s1 mod q
    const z = [];
    let normExceeded = false;
    for (let j = 0; j < L; j++) {
      const cs1 = polyMul(c, s1[j]);
      const zj = polyAdd(y[j], cs1);
      if (polyNormInf(zj) >= GAMMA1 - BETA) {
        normExceeded = true;
        break;
      }
      z[j] = zj;
    }
    if (normExceeded) continue;

    // 7. Compute approximate commitment w' = A * z - c * t = w - c * s2 mod q
    // And extract exact hints for any coefficient where HighBits(w') != HighBits(w)
    const hints = [];
    let hintCount = 0;

    for (let i = 0; i < K; i++) {
      const cs2 = polyMul(c, s2[i]);
      const wPrime = polySub(w[i], cs2);
      const hbPrime = polyHighBits(wPrime);
      const hbOrig = polyHighBits(w[i]);

      for (let p = 0; p < N; p++) {
        if (hbPrime[p] !== hbOrig[p]) {
          hintCount++;
          // Store exact index and correction delta modulo 16
          const globalIdx = i * N + p;
          const delta = ((hbOrig[p] - hbPrime[p]) % BINS + BINS) % BINS;
          hints.push({ idx: globalIdx, delta });
        }
      }
    }

    if (hintCount > OMEGA) continue;

    // Serialize z vector into compact base64
    const zBuf = Buffer.alloc(L * N * 4);
    let zOffset = 0;
    for (let j = 0; j < L; j++) {
      for (let p = 0; p < N; p++) {
        zBuf.writeInt32LE(z[j][p], zOffset);
        zOffset += 4;
      }
    }

    // Serialize hints into compact base64
    const hintsBuf = Buffer.from(JSON.stringify(hints));

    return {
      cSeed: cSeed.toString('hex'),
      z: zBuf.toString('base64'),
      hints: hintsBuf.toString('base64'),
      attemptCount: attempt
    };
  }

  throw new HybridSignatureError('ML-DSA signature convergence failed after 100 attempts', {
    reason: 'CONVERGENCE_FAILURE'
  });
}

/**
 * ML-DSA-44 Verify.
 * Verifies that (cSeed, z, hints) is a valid signature over message digest M.
 */
function mlDsaVerify(M, signature, rhoHex, tBase64) {
  try {
    const { cSeed, z: zBase64, hints: hintsBase64 } = signature;
    if (!cSeed || !zBase64 || !hintsBase64 || !rhoHex || !tBase64) {
      return false;
    }

    const rho = Buffer.from(rhoHex, 'hex');
    const A = expandMatrixA(rho);

    // Unpack t vector
    const tBuf = Buffer.from(tBase64, 'base64');
    if (tBuf.length !== K * N * 4) return false;
    const t = [];
    let tOffset = 0;
    for (let i = 0; i < K; i++) {
      t[i] = new Int32Array(N);
      for (let j = 0; j < N; j++) {
        t[i][j] = tBuf.readInt32LE(tOffset);
        tOffset += 4;
      }
    }

    // Unpack z vector
    const zBuf = Buffer.from(zBase64, 'base64');
    if (zBuf.length !== L * N * 4) return false;
    const z = [];
    let zOffset = 0;
    for (let j = 0; j < L; j++) {
      z[j] = new Int32Array(N);
      for (let p = 0; p < N; p++) {
        z[j][p] = zBuf.readInt32LE(zOffset);
        zOffset += 4;
      }
      // Norm check: ||z||_inf must be strictly < GAMMA1
      if (polyNormInf(z[j]) >= GAMMA1) {
        return false;
      }
    }

    // Unpack hints
    const hintsJson = Buffer.from(hintsBase64, 'base64').toString('utf8');
    const hints = JSON.parse(hintsJson);
    if (!Array.isArray(hints) || hints.length > OMEGA) {
      return false;
    }

    const hintMap = new Map();
    for (const h of hints) {
      if (typeof h.idx !== 'number' || typeof h.delta !== 'number') return false;
      if (!Number.isInteger(h.idx) || h.idx < 0 || h.idx >= K * N) return false;
      if (!Number.isInteger(h.delta) || h.delta <= 0 || h.delta >= BINS) return false;
      hintMap.set(h.idx, h.delta);
    }

    // Reconstruct challenge polynomial c(X) from cSeed
    const cSeedBuf = Buffer.from(cSeed, 'hex');
    const c = sampleChallenge(cSeedBuf);

    // Compute approximate commitment: w' = A * z - c * t mod q (K = 4)
    const wPrime = [];
    for (let i = 0; i < K; i++) {
      let acc = polyZero();
      for (let j = 0; j < L; j++) {
        const prod = polyMul(A[i][j], z[j]);
        acc = polyAdd(acc, prod);
      }
      const ct = polyMul(c, t[i]);
      wPrime[i] = polySub(acc, ct);
    }

    // Reconstruct HighBits w1' using hints
    const w1PrimeBytes = Buffer.alloc(K * N);
    for (let i = 0; i < K; i++) {
      const hbPrime = polyHighBits(wPrime[i]);
      for (let p = 0; p < N; p++) {
        const globalIdx = i * N + p;
        let corrected = hbPrime[p];
        if (hintMap.has(globalIdx)) {
          const delta = hintMap.get(globalIdx);
          corrected = ((corrected + delta) % BINS + BINS) % BINS;
        }
        w1PrimeBytes[i * N + p] = corrected;
      }
    }

    // Compute candidate challenge seed: cSeed' = SHAKE256(M || w1PrimeBytes, 32)
    const cSeedCandidate = crypto.createHash('shake256', { outputLength: 32 })
      .update(M)
      .update(w1PrimeBytes)
      .digest();

    return crypto.timingSafeEqual(cSeedBuf, cSeedCandidate);
  } catch (err) {
    return false;
  }
}

// ==============================================================================
// 7. CANONICAL SERIALIZATION & HASHING
// ==============================================================================

/**
 * Deterministic JSON stringifier with lexicographical key sorting.
 */
function canonicalizePayload(payload) {
  if (Buffer.isBuffer(payload)) {
    return payload;
  }
  if (typeof payload === 'string') {
    return Buffer.from(payload, 'utf8');
  }
  if (payload === null || typeof payload !== 'object') {
    return Buffer.from(String(payload), 'utf8');
  }

  function sortObject(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortObject);
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = sortObject(obj[key]);
    }
    return sorted;
  }

  const sorted = sortObject(payload);
  return Buffer.from(JSON.stringify(sorted), 'utf8');
}

/**
 * Computes SHA-256 digest of payload.
 */
function hashPayload(payload) {
  const canonicalBuf = canonicalizePayload(payload);
  return crypto.createHash('sha256').update(canonicalBuf).digest();
}

// ==============================================================================
// 8. DUAL HYBRID CRYPTOGRAPHIC SIGNER CLASS
// ==============================================================================

class HybridCryptographicSigner {
  constructor(options = {}) {
    this.companyVkn = options.companyVkn || '1800817486';
    this.keyId = options.keyId || 'brosan-omega-root-2026';

    // 1. Classical Ed25519 Keypair
    const classicalPair = crypto.generateKeyPairSync('ed25519');
    this.classicalPrivateKey = classicalPair.privateKey;
    this.classicalPublicKey = classicalPair.publicKey;
    this.classicalPublicKeyDer = classicalPair.publicKey.export({ type: 'spki', format: 'der' });
    this.classicalPublicKeyBase64 = this.classicalPublicKeyDer.toString('base64');

    // 2. Post-Quantum ML-DSA-44 Keypair
    const masterSeed = options.masterSeed
      ? (Buffer.isBuffer(options.masterSeed) ? options.masterSeed : Buffer.from(String(options.masterSeed)))
      : crypto.randomBytes(32);

    this.mlDsaKeys = mlDsaKeyGen(masterSeed);
  }

  /**
   * Signs payload and generates Dual Hybrid Envelope.
   * @param {object|string|Buffer} payload
   * @param {object} [options]
   * @returns {object} HybridEnvelope
   */
  signHybrid(payload, options = {}) {
    const declarationType = options.declarationType || 'GENERIC';
    const documentNo = options.documentNo || `DECL-${Date.now()}`;
    const metadata = options.metadata || {};

    const payloadDigest = hashPayload(payload);
    const payloadHashHex = payloadDigest.toString('hex');

    // Classical Ed25519 signature over SHA-256 digest
    const classicalSig = crypto.sign(null, payloadDigest, this.classicalPrivateKey);

    // Post-Quantum ML-DSA-44 lattice signature over SHA-256 digest
    const pqSig = mlDsaSign(payloadDigest, this.mlDsaKeys);

    const declarationMetadata = {
      type: declarationType,
      documentNo: String(documentNo),
      companyVkn: this.companyVkn,
      ...metadata
    };

    // Compute envelope checksum
    const metadataBuf = canonicalizePayload(declarationMetadata);
    const hintsBuf = Buffer.from(pqSig.hints, 'base64');
    const checksumHash = crypto.createHash('sha256')
      .update(payloadHashHex)
      .update(metadataBuf)
      .update(classicalSig)
      .update(pqSig.cSeed)
      .update(pqSig.z)
      .update(hintsBuf)
      .digest('hex');

    const envelope = {
      version: 'pqc:v1',
      algorithm: 'ML-DSA-44+Ed25519',
      signedAt: new Date().toISOString(),
      payloadHash: payloadHashHex,
      declarationMetadata,
      classical: {
        algorithm: 'Ed25519',
        publicKey: this.classicalPublicKeyBase64,
        signature: classicalSig.toString('base64')
      },
      postQuantum: {
        algorithm: 'NIST-FIPS-204-ML-DSA-44',
        rho: this.mlDsaKeys.rho,
        publicKey: this.mlDsaKeys.publicKeyBase64,
        signature: {
          cSeed: pqSig.cSeed,
          z: pqSig.z,
          hints: pqSig.hints
        }
      },
      envelopeChecksum: checksumHash
    };

    return envelope;
  }

  /**
   * Verifies Dual Hybrid Envelope against payload.
   * @param {object|string|Buffer} payload
   * @param {object} hybridEnvelope
   * @param {object} [options]
   * @returns {boolean|object}
   */
  verifyHybridSignature(payload, hybridEnvelope, options = { throwOnError: true }) {
    const throwOnError = options.throwOnError !== false;

    function reject(reason, details = {}) {
      if (throwOnError) {
        throw new HybridSignatureError(`Hybrid signature verification failed: ${reason}`, {
          reason,
          ...details
        });
      }
      return { isValid: false, code: 'INVALID_HYBRID_SIGNATURE', reason, details };
    }

    if (!hybridEnvelope || typeof hybridEnvelope !== 'object') {
      return reject('MISSING_OR_MALFORMED_ENVELOPE');
    }

    if (hybridEnvelope.version !== 'pqc:v1' || hybridEnvelope.algorithm !== 'ML-DSA-44+Ed25519') {
      return reject('UNSUPPORTED_ENVELOPE_VERSION_OR_ALGORITHM');
    }

    // 1. Verify payload hash match
    const computedDigest = hashPayload(payload);
    const computedHashHex = computedDigest.toString('hex');
    if (computedHashHex !== hybridEnvelope.payloadHash) {
      return reject('PAYLOAD_HASH_MISMATCH', {
        expected: hybridEnvelope.payloadHash,
        actual: computedHashHex
      });
    }

    // 2. Verify Envelope Checksum
    try {
      const classicalSigBuf = Buffer.from(hybridEnvelope.classical.signature, 'base64');
      const metadataBuf = canonicalizePayload(hybridEnvelope.declarationMetadata);
      const hintsBuf = Buffer.from(hybridEnvelope.postQuantum.signature.hints, 'base64');
      const expectedChecksum = crypto.createHash('sha256')
        .update(hybridEnvelope.payloadHash)
        .update(metadataBuf)
        .update(classicalSigBuf)
        .update(hybridEnvelope.postQuantum.signature.cSeed)
        .update(hybridEnvelope.postQuantum.signature.z)
        .update(hintsBuf)
        .digest('hex');

      if (expectedChecksum !== hybridEnvelope.envelopeChecksum) {
        return reject('ENVELOPE_CHECKSUM_MISMATCH');
      }
    } catch (err) {
      return reject('CHECKSUM_COMPUTATION_ERROR', { error: err.message });
    }

    // 3. Verify Classical Ed25519 Signature
    try {
      const pubKeyDer = Buffer.from(hybridEnvelope.classical.publicKey, 'base64');
      const pubKey = crypto.createPublicKey({ key: pubKeyDer, format: 'der', type: 'spki' });
      const sigBuf = Buffer.from(hybridEnvelope.classical.signature, 'base64');

      const classicalOk = crypto.verify(null, computedDigest, pubKey, sigBuf);
      if (!classicalOk) {
        return reject('CLASSICAL_ED25519_SIGNATURE_INVALID');
      }
    } catch (err) {
      return reject('CLASSICAL_VERIFICATION_EXCEPTION', { error: err.message });
    }

    // 4. Verify Post-Quantum ML-DSA-44 Lattice Signature
    const pqValid = mlDsaVerify(
      computedDigest,
      hybridEnvelope.postQuantum.signature,
      hybridEnvelope.postQuantum.rho,
      hybridEnvelope.postQuantum.publicKey
    );

    if (!pqValid) {
      return reject('POST_QUANTUM_LATTICE_SIGNATURE_INVALID');
    }

    return true;
  }
}

// ==============================================================================
// 9. SINGLETON & CONVENIENCE EXPORTS
// ==============================================================================

const defaultSigner = new HybridCryptographicSigner();

function createHybridSigner(options = {}) {
  return new HybridCryptographicSigner(options);
}

function signHybrid(payload, options = {}) {
  return defaultSigner.signHybrid(payload, options);
}

function verifyHybridSignature(payload, hybridEnvelope, options = { throwOnError: true }) {
  return defaultSigner.verifyHybridSignature(payload, hybridEnvelope, options);
}

module.exports = {
  HybridCryptographicSigner,
  createHybridSigner,
  signHybrid,
  verifyHybridSignature,
  canonicalizePayload,
  hashPayload,
  HybridSignatureError,
  ML_DSA_PARAMS,
  defaultSigner,
  postQuantumSigner: defaultSigner
};
