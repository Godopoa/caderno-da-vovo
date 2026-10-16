import crypto from 'crypto';

const MASTER_SECRET =
  process.env.CRYPTO_SECRET ||
  'vovo-master-secret-key-2026-aes256-hmac-sha256-protected';

// Deriva uma chave de 32 bytes (256 bits) para AES-256-GCM
const AES_KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest();

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: 'USER' | 'VIP' | 'ADMIN';
  isVip: boolean;
  exp: number;
}

/**
 * Hash seguro de senha usando scrypt (resistente a força bruta) + salt aleatório de 16 bytes
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verificação de senha em tempo constante (proteção contra Timing Attacks)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

/**
 * Gera um Token assinado digitalmente com HMAC-SHA256 (padrão JWT-like)
 */
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

/**
 * Valida a assinatura HMAC-SHA256 e a expiração do Token
 */
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

/**
 * Criptografia Simétrica Autenticada AES-256-GCM para dados sensíveis (chaves PIX, credenciais)
 */
export function encryptAES256(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descriptografia AES-256-GCM com validação de integridade (AuthTag)
 */
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

/**
 * Sanitização básica contra injeção de scripts (XSS)
 */
export function sanitizeInput(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
}
