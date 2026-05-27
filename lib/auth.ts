import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";

// --- PIN: hash con scrypt (salt per PIN) ---

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(pin, salt, 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// --- Token di sblocco: HMAC dell'id personaggio ---

function secret(): string {
  return process.env.SESSION_SECRET ?? "dev-secret-cambiami-in-produzione";
}

export function signId(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("hex");
}

export function verifyUnlockToken(id: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(signId(id), "hex");
  const actual = Buffer.from(token, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function unlockCookieName(id: string): string {
  return `unlock_${id}`;
}
