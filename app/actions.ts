"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { emptySheet, type Sheet } from "@/lib/sheet";
import {
  hashPin,
  verifyPin,
  signId,
  verifyUnlockToken,
  unlockCookieName,
} from "@/lib/auth";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

async function isUnlocked(id: string): Promise<boolean> {
  const store = await cookies();
  return verifyUnlockToken(id, store.get(unlockCookieName(id))?.value);
}

async function setUnlockCookie(id: string) {
  const store = await cookies();
  store.set(unlockCookieName(id), signId(id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function createCharacter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!name) return;
  if (!/^\d{4}$/.test(pin)) return;

  const id = randomUUID();
  await db.insert(characters).values({
    id,
    name,
    pinHash: hashPin(pin),
    data: emptySheet(),
  });
  await setUnlockCookie(id);
  redirect(`/personaggio/${id}`);
}

export async function unlock(
  id: string,
  pin: string,
): Promise<{ ok: boolean; error?: string }> {
  const rows = await db
    .select({ pinHash: characters.pinHash })
    .from(characters)
    .where(eq(characters.id, id));
  const row = rows[0];
  if (!row) return { ok: false, error: "Personaggio non trovato." };
  if (!verifyPin(pin, row.pinHash)) return { ok: false, error: "PIN errato." };

  await setUnlockCookie(id);
  revalidatePath(`/personaggio/${id}`);
  return { ok: true };
}

export async function lock(id: string): Promise<void> {
  const store = await cookies();
  store.delete(unlockCookieName(id));
  revalidatePath(`/personaggio/${id}`);
}

export async function saveSheet(
  id: string,
  name: string,
  sheet: Sheet,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isUnlocked(id))) {
    return { ok: false, error: "Non autorizzato: sblocca la scheda con il PIN." };
  }
  const cleanName = name.trim() || "Senza nome";
  await db
    .update(characters)
    .set({ name: cleanName, data: sheet, updatedAt: new Date() })
    .where(eq(characters.id, id));
  revalidatePath(`/personaggio/${id}`);
  revalidatePath("/");
  return { ok: true };
}
