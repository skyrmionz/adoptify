import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const KEYLEN = 64;

export async function hashPassword(plaintext: string): Promise<Buffer> {
  if (plaintext.length < 8) throw new Error("Password must be at least 8 characters");
  const salt = randomBytes(16);
  const derived = await scrypt(plaintext, salt, KEYLEN);
  // Layout: [16-byte salt][64-byte derived key]
  return Buffer.concat([salt, derived]);
}

export async function verifyPassword(plaintext: string, stored: Buffer): Promise<boolean> {
  if (stored.length < 16 + KEYLEN) return false;
  const salt = stored.subarray(0, 16);
  const expected = stored.subarray(16);
  const derived = await scrypt(plaintext, salt, KEYLEN);
  return timingSafeEqual(derived, expected);
}

