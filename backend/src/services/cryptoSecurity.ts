import crypto from 'crypto';

const MASTER_SECRET =
  process.env.CRYPTO_SECRET ||
  'vovo-master-secret-key-2026-aes256-hmac-sha256-protected';

const AES_KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest();

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: 'USER' | 'VIP' | 'ADMIN';
  isVip: boolean;
  exp: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

export function signAuthToken(payload: Omit<TokenPayload, 'exp'>, expiresInHours = 168): string {
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Date.now() + expiresInHours * 3600 * 1000,
  };
  const dataB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(dataB64)
    .digest('base64url');
  return `${dataB64}.${signature}`;
}

export function verifyAuthToken(token?: string): TokenPayload | null {
  if (!token || !token.includes('.')) return null;
  const [dataB64, signature] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(dataB64)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function encryptAES256(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptAES256(cipherText?: string | null): string {
  if (!cipherText || !cipherText.includes(':')) return '';
  try {
    const [ivHex, tagHex, encHex] = cipherText.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      AES_KEY,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function sanitizeInput(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
}

/**
 * CAPTCHA PRÓPRIO DA VOVÓ (Gerador Visual SVG + Token Assinado HMAC-SHA256)
 */
export function generateCustomCaptcha() {
  const numA = crypto.randomInt(2, 9);
  const numB = crypto.randomInt(1, 7);
  const items = ['xícaras', 'ovos', 'colheres', 'fatias', 'maçãs'];
  const item = items[crypto.randomInt(0, items.length)];
  const answer = String(numA + numB);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 220 60">
    <rect width="100%" height="100%" rx="12" fill="#FFF8EE" stroke="#E2D5C1" stroke-width="2"/>
    <path d="M12 45 Q 65 10, 120 42 T 208 22" stroke="#F3D8B6" stroke-width="3" fill="none"/>
    <path d="M18 18 Q 95 52, 160 18 T 205 45" stroke="#E8C5B0" stroke-width="2" fill="none"/>
    <circle cx="35" cy="20" r="3" fill="#C83E5B" opacity="0.4"/>
    <circle cx="175" cy="42" r="4" fill="#1E7E5A" opacity="0.4"/>
    <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#8C2D41" letter-spacing="2">
      ${numA} + ${numB} ${item} = ?
    </text>
  </svg>`;

  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  const payload = {
    ans: crypto.createHash('sha256').update(`${answer}:${MASTER_SECRET}`).digest('hex'),
    exp: Date.now() + 10 * 60 * 1000, // 10 min
    nonce: crypto.randomBytes(6).toString('hex'),
  };
  const dataB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', MASTER_SECRET).update(dataB64).digest('base64url');

  return {
    svgDataUri,
    promptText: `Resolva a continha da cozinha: quanto é ${numA} + ${numB}?`,
    captchaToken: `${dataB64}.${sig}`,
  };
}

export function verifyCustomCaptcha(captchaToken?: string, userAnswer?: string): boolean {
  if (!captchaToken || !userAnswer || !captchaToken.includes('.')) return false;
  const [dataB64, sig] = captchaToken.split('.');
  const expectedSig = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(dataB64)
    .digest('base64url');

  if (sig !== expectedSig) return false;

  try {
    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return false;
    const cleanAns = String(userAnswer).trim();
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${cleanAns}:${MASTER_SECRET}`)
      .digest('hex');
    return payload.ans === expectedHash;
  } catch {
    return false;
  }
}
