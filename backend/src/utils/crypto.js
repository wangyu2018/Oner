import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// 密码库加密密钥（优先使用 PASSWORD_VAULT_KEY，降级到 JWT_SECRET）
function getVaultKey() {
  const key = process.env.PASSWORD_VAULT_KEY || process.env.JWT_SECRET;
  // 派生为 32 字节的 AES-256 密钥
  return crypto.scryptSync(key, 'oner-vault-salt', 32);
}

/**
 * AES-256-GCM 加密
 * 返回格式: iv:authTag:ciphertext (hex 编码)
 */
export function encryptVaultPassword(plaintext) {
  const key = getVaultKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * AES-256-GCM 解密
 * 输入格式: iv:authTag:ciphertext (hex 编码)
 */
export function decryptVaultPassword(encrypted) {
  try {
    const key = getVaultKey();
    const parts = encrypted.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');
    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err.message);
    return null;
  }
}
