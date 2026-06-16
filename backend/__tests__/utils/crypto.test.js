import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, encryptVaultPassword, decryptVaultPassword } from '../../src/utils/crypto.js';

describe('crypto.js', () => {
  // ===== bcrypt =====
  describe('hashPassword / comparePassword', () => {
    it('CR-01: hashPassword 返回 60 字符 bcrypt hash', async () => {
      const hash = await hashPassword('testpass123');
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt 前缀
      expect(hash.length).toBe(60);
    });

    it('CR-02: comparePassword 正确密码返回 true', async () => {
      const hash = await hashPassword('testpass123');
      const result = await comparePassword('testpass123', hash);
      expect(result).toBe(true);
    });

    it('CR-03: comparePassword 错误密码返回 false', async () => {
      const hash = await hashPassword('testpass123');
      const result = await comparePassword('wrongpass', hash);
      expect(result).toBe(false);
    });
  });

  // ===== AES-256-GCM =====
  describe('encryptVaultPassword / decryptVaultPassword', () => {
    it('CR-04: encryptVaultPassword 返回 iv:authTag:ciphertext 格式', () => {
      const encrypted = encryptVaultPassword('mypassword');
      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);
      // iv 16 字节 → 32 hex, authTag 16 字节 → 32 hex
      expect(parts[0].length).toBe(32); // iv
      expect(parts[1].length).toBe(32); // authTag
    });

    it('CR-05: decryptVaultPassword 正确解密', () => {
      const plaintext = 'mypassword';
      const encrypted = encryptVaultPassword(plaintext);
      const decrypted = decryptVaultPassword(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('CR-06: decryptVaultPassword 错误密文返回 null', () => {
      const result = decryptVaultPassword('invalid:format:data');
      expect(result).toBeNull();
    });

    it('CR-07: decryptVaultPassword 无效格式返回 null', () => {
      const result = decryptVaultPassword('tooshort');
      expect(result).toBeNull();
    });

    it('CR-08: 空字符串加密解密往返正确', () => {
      const encrypted = encryptVaultPassword('');
      const decrypted = decryptVaultPassword(encrypted);
      expect(decrypted).toBe('');
    });

    it('CR-09: 特殊字符加密解密往返正确', () => {
      const special = '!@#$%^&*()中文 测试 😀';
      const encrypted = encryptVaultPassword(special);
      const decrypted = decryptVaultPassword(encrypted);
      expect(decrypted).toBe(special);
    });

    it('CR-10: 每次加密同一明文产生不同密文（随机 IV）', () => {
      const plaintext = 'samepassword';
      const encrypted1 = encryptVaultPassword(plaintext);
      const encrypted2 = encryptVaultPassword(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
      // 但两者都能正确解密
      expect(decryptVaultPassword(encrypted1)).toBe(plaintext);
      expect(decryptVaultPassword(encrypted2)).toBe(plaintext);
    });
  });
});
