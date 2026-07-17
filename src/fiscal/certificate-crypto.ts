// Encryption helpers for tenant-uploaded digital certificates (A1 .pfx files
// and their passphrases). Helvok Tax never stores certificate material in
// plaintext: every byte that touches the database goes through AES-256-GCM
// first, with a key that lives only as a Cloudflare Worker secret
// (HELVOK_CERT_ENCRYPTION_KEY), never in source control or the database.
//
// This module only encrypts/decrypts bytes. It has no opinion about what a
// certificate is for, which country requires it, or how it gets used by a
// future signing adapter — that separation keeps the Core country-neutral.

export class CertificateEncryptionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CertificateEncryptionConfigError";
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

export async function loadCertificateEncryptionKey(rawKey: string | undefined): Promise<CryptoKey> {
  const trimmed = (rawKey || "").trim();
  if (!trimmed) {
    throw new CertificateEncryptionConfigError(
      "HELVOK_CERT_ENCRYPTION_KEY is not configured. Run `wrangler secret put HELVOK_CERT_ENCRYPTION_KEY` with a 32-byte base64 key before uploading certificates.",
    );
  }

  let keyBytes: Uint8Array;
  try {
    keyBytes = base64ToBytes(trimmed);
  } catch {
    throw new CertificateEncryptionConfigError("HELVOK_CERT_ENCRYPTION_KEY must be valid base64.");
  }

  if (keyBytes.length !== 32) {
    throw new CertificateEncryptionConfigError(
      `HELVOK_CERT_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM (got ${keyBytes.length}).`,
    );
  }

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export interface EncryptedPayload {
  ciphertext_base64: string;
  iv_base64: string;
}

export async function encryptToBase64(key: CryptoKey, plaintextBase64: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = base64ToBytes(plaintextBase64);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintextBytes);
  return {
    ciphertext_base64: bytesToBase64(new Uint8Array(ciphertext)),
    iv_base64: bytesToBase64(iv),
  };
}

export async function encryptTextToBase64(key: CryptoKey, plaintext: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    ciphertext_base64: bytesToBase64(new Uint8Array(ciphertext)),
    iv_base64: bytesToBase64(iv),
  };
}

export async function decryptFromBase64(key: CryptoKey, payload: EncryptedPayload): Promise<Uint8Array> {
  const iv = base64ToBytes(payload.iv_base64);
  const ciphertext = base64ToBytes(payload.ciphertext_base64);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new Uint8Array(plaintext);
}

export async function decryptTextFromBase64(key: CryptoKey, payload: EncryptedPayload): Promise<string> {
  const bytes = await decryptFromBase64(key, payload);
  return new TextDecoder().decode(bytes);
}
