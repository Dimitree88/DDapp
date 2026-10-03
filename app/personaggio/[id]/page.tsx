import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { normalizeSheet } from "@/lib/sheet";
import CharacterClient from "./CharacterClient";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await db.select().from(characters).where(eq(characters.id, id));
  const row = rows[0];
  if (!row) notFound();

  return <CharacterClient id={row.id} name={row.name} sheet={normalizeSheet(row.data)} />;
}
