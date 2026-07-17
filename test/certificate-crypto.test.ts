import { describe, expect, it } from "vitest";

import {
  CertificateEncryptionConfigError,
  decryptFromBase64,
  decryptTextFromBase64,
  encryptTextToBase64,
  encryptToBase64,
  loadCertificateEncryptionKey,
} from "../src/fiscal/certificate-crypto";

const TEST_KEY_BASE64 = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i + 1)));

describe("certificate encryption", () => {
  it("rejects a missing encryption key with a clear configuration error", async () => {
    await expect(loadCertificateEncryptionKey(undefined)).rejects.toBeInstanceOf(CertificateEncryptionConfigError);
    await expect(loadCertificateEncryptionKey("")).rejects.toThrow(/not configured/i);
  });

  it("rejects a key that is not valid base64 or not 32 bytes", async () => {
    await expect(loadCertificateEncryptionKey("not-base64-!!!")).rejects.toThrow(/base64/i);
    await expect(loadCertificateEncryptionKey(btoa("too-short"))).rejects.toThrow(/32 bytes/i);
  });

  it("round-trips arbitrary bytes (simulating a .pfx file) through AES-256-GCM", async () => {
    const key = await loadCertificateEncryptionKey(TEST_KEY_BASE64);
    const fakePfxBytes = new Uint8Array([0x30, 0x82, 0x01, 0x02, 0xff, 0x00, 0x9a]);
    const fakePfxBase64 = btoa(String.fromCharCode(...fakePfxBytes));

    const encrypted = await encryptToBase64(key, fakePfxBase64);
    expect(encrypted.ciphertext_base64).not.toBe(fakePfxBase64);
    expect(encrypted.iv_base64.length).toBeGreaterThan(0);

    const decrypted = await decryptFromBase64(key, encrypted);
    expect(Array.from(decrypted)).toEqual(Array.from(fakePfxBytes));
  });

  it("round-trips a certificate passphrase through AES-256-GCM", async () => {
    const key = await loadCertificateEncryptionKey(TEST_KEY_BASE64);
    const passphrase = "correct-horse-battery-staple-123";

    const encrypted = await encryptTextToBase64(key, passphrase);
    expect(encrypted.ciphertext_base64).not.toContain(passphrase);

    const decrypted = await decryptTextFromBase64(key, encrypted);
    expect(decrypted).toBe(passphrase);
  });

  it("produces different ciphertext for the same plaintext on each call (random IV)", async () => {
    const key = await loadCertificateEncryptionKey(TEST_KEY_BASE64);
    const a = await encryptTextToBase64(key, "same-secret");
    const b = await encryptTextToBase64(key, "same-secret");
    expect(a.ciphertext_base64).not.toBe(b.ciphertext_base64);
    expect(a.iv_base64).not.toBe(b.iv_base64);
  });

  it("fails to decrypt with the wrong key", async () => {
    const key = await loadCertificateEncryptionKey(TEST_KEY_BASE64);
    const otherKeyBase64 = btoa(String.fromCharCode(...Array.from({ length: 32 }, () => 7)));
    const otherKey = await loadCertificateEncryptionKey(otherKeyBase64);

    const encrypted = await encryptTextToBase64(key, "secret-payload");
    await expect(decryptTextFromBase64(otherKey, encrypted)).rejects.toThrow();
  });
});
