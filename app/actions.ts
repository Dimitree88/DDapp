"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { emptySheet, type Sheet } from "@/lib/sheet";

export async function createCharacter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const id = randomUUID();
  await db.insert(characters).values({
    id,
    name,
    pinHash: "",
    data: emptySheet(),
  });
  redirect(`/personaggio/${id}`);
}

export async function deleteCharacter(id: string) {
  await db.delete(characters).where(eq(characters.id, id));
  revalidatePath("/");
}

export async function saveSheet(
  id: string,
  name: string,
  sheet: Sheet,
): Promise<{ ok: boolean; error?: string }> {
  const cleanName = name.trim() || "Senza nome";
  await db
    .update(characters)
    .set({ name: cleanName, data: sheet, updatedAt: new Date() })
    .where(eq(characters.id, id));
  revalidatePath(`/personaggio/${id}`);
  revalidatePath("/");
  return { ok: true };
}
