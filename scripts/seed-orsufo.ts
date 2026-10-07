import "dotenv/config";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { creatures } from "../lib/db/schema";
import type { CreatureData } from "../lib/creature";

const id = "orsufo";

const data: CreatureData = {
  origin: "personalizzata",
  description: "Cucciolo di guforso",
  creatureType: "Mostruosità",
  size: "Piccola",
  armorClass: 12,
  armorClassNote: "Pelliccia spessa",
  hitPointsMax: 9,
  hitPointsCurrent: 9,
  speedMeters: 9,
  challengeRating: "0",
  experiencePoints: 10,
  actions: [{
    name: "Beccata",
    attackType: "Tiro per colpire in mischia",
    hitBonus: 3,
    reachMeters: null,
    hitDamage: 3,
    damageFormula: "1d4 + 1",
    damageType: "perforanti",
  }],
  traits: [{
    name: "Plot Armor (Mascotte)",
    description: "Se il cucciolo scende a 0 PF in combattimento, non muore. Il Master decide di volta in volta se sviene per lo spavento o scappa a nascondersi; torna dal gruppo a scontro finito. Il Master stabilisce i PF al ritorno.",
    adjudication: "master",
  }],
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL non impostata");
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS creatures (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`);
    const existing = await db.select({ id: creatures.id }).from(creatures).where(eq(creatures.id, id));
    if (existing.length) {
      console.log("Orsufo è già presente; nessuna modifica eseguita.");
      return;
    }
    await db.insert(creatures).values({ id, name: "Orsufo", data });
    console.log("Orsufo inserito come creatura personalizzata.");
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
