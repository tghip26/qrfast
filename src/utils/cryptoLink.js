// Utility for generating randomized encrypted URL slugs and decoding payment parameters

/**
 * Generates a random alphanumeric string
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const cryptoObj = typeof window !== 'undefined' ? (window.crypto || window.msCrypto) : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}

/**
 * Encodes payment data into a randomized URL-safe token.
 * Every invocation generates a completely unique token due to the random salt.
 */
export function encodePaymentData(data) {
  const salt = generateRandomString(12);
  const timestamp = Date.now();
  const id = `qf_${timestamp.toString(36)}_${generateRandomString(4)}`;

  const payload = {
    v: 1,
    id,
    t: timestamp,
    b: data.bankBin || data.bankCode || '',
    a: data.accountNo || '',
    n: data.accountName || '',
    m: data.amount ? String(data.amount) : '',
    d: data.memo || '',
    theme: data.theme || 'ocean',
    template: data.template || 'compact2'
  };

  const jsonStr = JSON.stringify(payload);
  const textEncoder = new TextEncoder();
  const bytes = textEncoder.encode(jsonStr);

  // Scramble bytes using the salt as a dynamic keystream
  const scrambled = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const saltChar = salt.charCodeAt(i % salt.length);
    const key = (saltChar ^ ((i * 31 + 7) & 0xff)) & 0xff;
    scrambled[i] = bytes[i] ^ key;
  }

  // Combine salt length + salt + scrambled bytes
  const saltBytes = textEncoder.encode(salt);
  const combined = new Uint8Array(1 + saltBytes.length + scrambled.length);
  combined[0] = saltBytes.length;
  combined.set(saltBytes, 1);
  combined.set(scrambled, 1 + saltBytes.length);

  // Convert to Base64URL
  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return {
    id,
    token: base64url,
    createdAt: timestamp,
    ...data
  };
}

/**
 * Decodes a token back into payment data.
 * Returns null if token is corrupted or invalid.
 */
export function decodePaymentData(token) {
  try {
    if (!token || typeof token !== 'string') return null;

    // Convert Base64URL back to standard Base64
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const binary = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 6) return null;

    const saltLen = combined[0];
    if (combined.length <= 1 + saltLen) return null;

    const textDecoder = new TextDecoder();
    const saltBytes = combined.slice(1, 1 + saltLen);
    const salt = textDecoder.decode(saltBytes);

    const scrambled = combined.slice(1 + saltLen);
    const bytes = new Uint8Array(scrambled.length);

    for (let i = 0; i < scrambled.length; i++) {
      const saltChar = salt.charCodeAt(i % salt.length);
      const key = (saltChar ^ ((i * 31 + 7) & 0xff)) & 0xff;
      bytes[i] = scrambled[i] ^ key;
    }

    const jsonStr = textDecoder.decode(bytes);
    const payload = JSON.parse(jsonStr);

    if (!payload || !payload.b || !payload.a) {
      return null;
    }

    return {
      id: payload.id,
      bankBin: payload.b,
      accountNo: payload.a,
      accountName: payload.n || '',
      amount: payload.m || '',
      memo: payload.d || '',
      theme: payload.theme || 'ocean',
      template: payload.template || 'compact2',
      createdAt: payload.t || Date.now()
    };
  } catch (err) {
    console.error('Failed to decode payment token:', err);
    return null;
  }
}
