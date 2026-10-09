/**
 * BROSAN TEKSTİL ERP — RFC 6238 TOTP CRYPTOGRAPHIC ENGINE
 * Multi-Factor Authentication (2FA) Cryptographic Core:
 * - RFC 6238 (Time-Based One-Time Password Algorithm)
 * - RFC 4226 (HMAC-Based One-Time Password Algorithm)
 * - RFC 4648 (Base32 Alphabet and Decoding/Encoding)
 * - Timing-Attack Immune Equality via SHA-256 Pre-Digested crypto.timingSafeEqual
 * - Monotonic Step Tracking Anti-Replay Defense
 * - Pure Zero-Dependency Native Node.js crypto Implementation
 * - Native Pure JS QR Code (SVG & Data URL) Matrix Generator for Authenticator Apps
 */

const crypto = require('crypto');

/**
 * Zeroize memory buffer in place (Phase 8 Zero-Knowledge Memory Cleansing)
 * @param {Buffer|Uint8Array} buf
 */
function zeroizeBuffer(buf) {
  if (Buffer.isBuffer(buf)) {
    buf.fill(0);
  } else if (buf && typeof buf.fill === 'function') {
    buf.fill(0);
  }
}

// ==============================================================================
// 1. BASE32 ENCODING & DECODING (RFC 4648)
// ==============================================================================
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(str) {
  if (typeof str !== 'string') {
    throw new Error('Base32 input must be a string');
  }
  const clean = str.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character encountered: '${clean[i]}'`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

// ==============================================================================
// 2. SECRET GENERATION (160-BIT / 20-BYTE CRYPTOGRAPHIC RANDOM)
// ==============================================================================
function generateSecret(byteLength = 20) {
  const buf = crypto.randomBytes(byteLength);
  return base32Encode(buf);
}

// ==============================================================================
// 3. RFC 6238 / RFC 4226 OTP CALCULATION
// ==============================================================================
function generateOtpAtStep(secretBuffer, step, digits = 6) {
  if (!Buffer.isBuffer(secretBuffer)) {
    secretBuffer = Buffer.from(secretBuffer);
  }
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(step));

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(buf);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226 section 5.4)
  const offset = digest[19] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otpMod = binary % Math.pow(10, digits);
  return otpMod.toString().padStart(digits, '0');
}

// ==============================================================================
// 4. TIMING-ATTACK RESISTANT CONSTANT-TIME CODE COMPARISON
// ==============================================================================
function timingSafeCodeCheck(inputCode, expectedCode) {
  if (typeof inputCode !== 'string' || typeof expectedCode !== 'string') {
    return false;
  }
  const a = inputCode.trim();
  const b = expectedCode.trim();
  if (!a || !b) return false;

  // SHA-256 pre-hashing ensures identical 32-byte buffer length,
  // preventing RangeError and eliminating length-dependent timing leakage
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// ==============================================================================
// 5. TOTP VERIFICATION WITH ANTI-REPLAY & WINDOW DRIFT DEFENSE
// ==============================================================================
function verifyTotp(secretBase32, inputCode, lastStep = null, window = 1) {
  let secretBuffer = null;
  try {
    if (!secretBase32 || typeof secretBase32 !== 'string') {
      return { valid: false, code: 'INVALID_SECRET' };
    }
    if (!inputCode || (typeof inputCode !== 'string' && typeof inputCode !== 'number')) {
      return { valid: false, code: 'INVALID_CODE_FORMAT' };
    }

    const cleanCode = String(inputCode).trim();
    if (!/^\d{6,8}$/.test(cleanCode)) {
      return { valid: false, code: 'INVALID_CODE_FORMAT' };
    }

    secretBuffer = base32Decode(secretBase32);
    const digits = cleanCode.length;
    const currentStep = Math.floor(Date.now() / 1000 / 30);

    for (let offset = -window; offset <= window; offset++) {
      const step = currentStep + offset;
      if (step < 0) continue;

      const expectedOtp = generateOtpAtStep(secretBuffer, step, digits);
      if (timingSafeCodeCheck(cleanCode, expectedOtp)) {
        // Anti-Replay Defense:
        // A step counter already used cannot be replayed within the same time window
        if (lastStep !== null && lastStep !== undefined) {
          const lastStepBig = BigInt(lastStep);
          const currentStepBig = BigInt(step);
          if (currentStepBig <= lastStepBig) {
            return {
              valid: false,
              code: 'REPLAY_ATTACK',
              step: currentStepBig,
              error: 'Tek kullanımlık kod daha önce kullanılmıştır (Anti-Replay Koruması).'
            };
          }
        }

        return {
          valid: true,
          step: BigInt(step),
          delta: offset
        };
      }
    }

    return { valid: false, code: 'INVALID_CODE' };
  } catch (err) {
    return { valid: false, code: 'DECODE_ERROR', error: err.message };
  } finally {
    if (secretBuffer) {
      zeroizeBuffer(secretBuffer);
    }
  }
}

// ==============================================================================
// 6. OTPAUTH URI SPECIFICATION (RFC 6238)
// ==============================================================================
function getOtpauthUri(username, secret, issuer = 'Brosan Tekstil') {
  const cleanIssuer = issuer || 'Brosan Tekstil';
  const cleanUsername = username || 'admin';
  const label = `${encodeURIComponent(cleanIssuer)}:${encodeURIComponent(cleanUsername)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(cleanIssuer)}&algorithm=SHA1&digits=6&period=30`;
}

// ==============================================================================
// 7. SINGLE-USE RECOVERY CODES
// ==============================================================================
function generateRecoveryCodes(count = 8) {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
    const formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    plainCodes.push(formatted);

    const normalized = formatted.replace(/[^A-Z0-9]/g, '');
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

function verifyRecoveryCode(inputCode, hashedCodesList) {
  if (!inputCode || typeof inputCode !== 'string' || !Array.isArray(hashedCodesList)) {
    return { valid: false };
  }
  const clean = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 8) return { valid: false };

  const inputHash = crypto.createHash('sha256').update(clean).digest('hex');
  let matchedIdx = -1;

  for (let i = 0; i < hashedCodesList.length; i++) {
    const storedHash = hashedCodesList[i];
    if (typeof storedHash === 'string' && timingSafeCodeCheck(inputHash, storedHash)) {
      matchedIdx = i;
      break;
    }
  }

  if (matchedIdx !== -1) {
    const remaining = [...hashedCodesList];
    remaining.splice(matchedIdx, 1);
    return {
      valid: true,
      matchedIndex: matchedIdx,
      remainingCodes: remaining
    };
  }

  return { valid: false };
}

// ==============================================================================
// 8. ZERO-DEPENDENCY PURE JS QR CODE GENERATOR (SVG & DATA URL)
// ==============================================================================
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], root);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCompute(data, degree) {
  const gen = rsGeneratorPoly(degree);
  const res = new Uint8Array(degree);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    for (let j = 0; j < degree - 1; j++) {
      res[j] = res[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    res[degree - 1] = gfMul(gen[degree], factor);
  }
  return res;
}

const EC_SPECS = {
  1: { L: { ecCodewords: 7, g1Blocks: 1, g1Data: 19, g2Blocks: 0, g2Data: 0 } },
  2: { L: { ecCodewords: 10, g1Blocks: 1, g1Data: 34, g2Blocks: 0, g2Data: 0 } },
  3: { L: { ecCodewords: 15, g1Blocks: 1, g1Data: 55, g2Blocks: 0, g2Data: 0 } },
  4: { L: { ecCodewords: 20, g1Blocks: 1, g1Data: 80, g2Blocks: 0, g2Data: 0 } },
  5: { L: { ecCodewords: 26, g1Blocks: 1, g1Data: 108, g2Blocks: 0, g2Data: 0 } },
  6: { L: { ecCodewords: 18, g1Blocks: 2, g1Data: 68, g2Blocks: 0, g2Data: 0 } },
  7: { L: { ecCodewords: 20, g1Blocks: 2, g1Data: 78, g2Blocks: 0, g2Data: 0 } },
  8: { L: { ecCodewords: 24, g1Blocks: 2, g1Data: 97, g2Blocks: 0, g2Data: 0 } },
  9: { L: { ecCodewords: 30, g1Blocks: 2, g1Data: 116, g2Blocks: 0, g2Data: 0 } },
  10: { L: { ecCodewords: 18, g1Blocks: 2, g1Data: 68, g2Blocks: 2, g2Data: 69 } }
};

const ALIGN_CENTERS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50]
};

const FORMAT_BITS_L = [
  0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976
];

function selectVersion(dataLength) {
  for (let v = 1; v <= 10; v++) {
    const spec = EC_SPECS[v].L;
    const capacity = spec.g1Blocks * spec.g1Data + spec.g2Blocks * spec.g2Data;
    const countBits = v <= 9 ? 8 : 16;
    const totalBits = 4 + countBits + dataLength * 8;
    if (Math.ceil(totalBits / 8) <= capacity) {
      return v;
    }
  }
  throw new Error('Data length exceeds capacity for QR code versions 1-10');
}

function buildBitStream(text, version) {
  const data = Buffer.from(text, 'utf8');
  const countBits = version <= 9 ? 8 : 16;
  const spec = EC_SPECS[version].L;
  const totalDataBytes = spec.g1Blocks * spec.g1Data + spec.g2Blocks * spec.g2Data;

  const bits = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  }

  // Byte mode: 0100
  pushBits(0b0100, 4);
  pushBits(data.length, countBits);
  for (let i = 0; i < data.length; i++) {
    pushBits(data[i], 8);
  }

  // Terminator
  const rem = totalDataBytes * 8 - bits.length;
  pushBits(0, Math.min(4, Math.max(0, rem)));

  // Pad to byte
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes
  const pad = [0xec, 0x11];
  let pIdx = 0;
  while (bits.length < totalDataBytes * 8) {
    pushBits(pad[pIdx % 2], 8);
    pIdx++;
  }

  const bytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    bytes[i] = b;
  }
  return bytes;
}

function createMatrix(version) {
  const size = 17 + 4 * version;
  const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));

  function setModule(r, c, val) {
    matrix[r][c] = val ? 1 : 0;
    isFunction[r][c] = true;
  }

  // 1. Finders
  const finders = [[0, 0], [0, size - 7], [size - 7, 0]];
  for (const [row, col] of finders) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          setModule(row + r, col + c, 1);
        } else {
          setModule(row + r, col + c, 0);
        }
      }
    }
  }

  // Separators
  for (let r = 0; r < 8; r++) {
    setModule(r, 7, 0);
    setModule(r, size - 8, 0);
    setModule(size - 8 + (r < 7 ? r : 7), 7, 0);
  }
  for (let c = 0; c < 8; c++) {
    setModule(7, c, 0);
    setModule(7, size - 8 + (c < 7 ? c : 7), 0);
    setModule(size - 8, c, 0);
  }

  // 2. Timing
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0 ? 1 : 0);
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // 3. Dark module
  setModule(4 * version + 9, 8, 1);

  // 4. Alignment patterns
  const centers = ALIGN_CENTERS[version] || [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = 0; j < centers.length; j++) {
      const cr = centers[i];
      const cc = centers[j];
      if ((cr <= 8 && cc <= 8) || (cr <= 8 && cc >= size - 9) || (cr >= size - 9 && cc <= 8)) {
        continue;
      }
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const isBlack = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
          setModule(cr + r, cc + c, isBlack ? 1 : 0);
        }
      }
    }
  }

  // 5. Reserve format info
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  return { size, matrix, isFunction };
}

function encodeToMatrix(text) {
  const version = selectVersion(text.length);
  const spec = EC_SPECS[version].L;
  const dataBytes = buildBitStream(text, version);

  const blocks = [];
  const ecBlocks = [];
  let offset = 0;

  for (let b = 0; b < spec.g1Blocks; b++) {
    const blk = dataBytes.slice(offset, offset + spec.g1Data);
    blocks.push(blk);
    ecBlocks.push(rsCompute(blk, spec.ecCodewords));
    offset += spec.g1Data;
  }
  for (let b = 0; b < spec.g2Blocks; b++) {
    const blk = dataBytes.slice(offset, offset + spec.g2Data);
    blocks.push(blk);
    ecBlocks.push(rsCompute(blk, spec.ecCodewords));
    offset += spec.g2Data;
  }

  const interleaved = [];
  const maxDataLen = Math.max(spec.g1Data, spec.g2Data);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < blocks.length; b++) {
      if (i < blocks[b].length) interleaved.push(blocks[b][i]);
    }
  }
  for (let i = 0; i < spec.ecCodewords; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      interleaved.push(ecBlocks[b][i]);
    }
  }

  const bits = [];
  for (let i = 0; i < interleaved.length; i++) {
    for (let j = 7; j >= 0; j--) {
      bits.push((interleaved[i] >>> j) & 1);
    }
  }

  const { size, matrix, isFunction } = createMatrix(version);

  let bitIdx = 0;
  let dir = -1;
  let c = size - 1;
  while (c > 0) {
    if (c === 6) c--;
    const rStart = dir === -1 ? size - 1 : 0;
    const rEnd = dir === -1 ? -1 : size;
    const rStep = dir === -1 ? -1 : 1;

    for (let r = rStart; r !== rEnd; r += rStep) {
      for (const colOffset of [0, 1]) {
        const col = c - colOffset;
        if (!isFunction[r][col]) {
          matrix[r][col] = bitIdx < bits.length ? bits[bitIdx++] : 0;
        }
      }
    }
    dir = -dir;
    c -= 2;
  }

  // Mask 0: (r + col) % 2 === 0
  const mask = 0;
  for (let r = 0; r < size; r++) {
    for (let col = 0; col < size; col++) {
      if (!isFunction[r][col]) {
        if ((r + col) % 2 === 0) {
          matrix[r][col] ^= 1;
        }
      }
    }
  }

  const fmtBits = FORMAT_BITS_L[mask];
  for (let i = 0; i < 15; i++) {
    const bit = (fmtBits >>> (14 - i)) & 1;
    if (i <= 5) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    if (i < 8) {
      matrix[size - 1 - i][8] = bit;
    } else {
      matrix[8][size - 15 + i] = bit;
    }
  }

  return { size, matrix };
}

function generateQrSvg(text, margin = 4, sizePx = 256) {
  try {
    const { size, matrix } = encodeToMatrix(text);
    const totalSize = size + margin * 2;
    let pathD = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === 1) {
          pathD += `M${c + margin} ${r + margin}h1v1h-1z `;
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path fill="#000" d="${pathD.trim()}"/></svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return { svg, dataUrl, size };
  } catch (err) {
    // Graceful fallback for strings exceeding version 10
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}"><rect width="100%" height="100%" fill="#f8f9fa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#666">QR Preview</text></svg>`;
    return {
      svg: fallbackSvg,
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`,
      size: 0
    };
  }
}

// ==============================================================================
// 9. MODULE EXPORTS
// ==============================================================================
module.exports = {
  base32Encode,
  base32Decode,
  generateSecret,
  generateOtpAtStep,
  timingSafeCodeCheck,
  verifyTotp,
  zeroizeBuffer,
  getOtpauthUri,
  generateRecoveryCodes,
  verifyRecoveryCode,
  generateQrSvg
};
