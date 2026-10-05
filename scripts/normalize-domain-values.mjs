import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

config({ path: ".env.local", quiet: true });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const apply = process.argv.includes("--apply");
const allLanguages = [...regole.lingue.standard, ...regole.lingue.rare];
const allWeapons = [...regole.armi.semplici, ...regole.armi.daGuerra];
const allFeats = Object.values(regole.talenti).flat();
const errors = [];

function choose(value, allowed, context) {
  if (!value) return "";
  const normalized = String(value).trim().toLocaleLowerCase("it");
  const found = allowed.find((option) => option.toLocaleLowerCase("it") === normalized);
  if (!found) errors.push(`${context}: ${JSON.stringify(value)}`);
  return found ?? value;
}

function list(value) {
  if (Array.isArray(value)) return value;
  return typeof value === "string" ? value.split(/[;,\n]/).map((item) => item.trim()).filter(Boolean) : [];
}

function convert(raw, name) {
  const sheet = structuredClone(raw);
  sheet.classe = choose(sheet.classe, Object.keys(regole.classi), `${name} classe`);
  sheet.sottoclasse ??= "";
  if (sheet.sottoclasse) sheet.sottoclasse = choose(sheet.sottoclasse, regole.classi[sheet.classe] ?? [], `${name} sottoclasse`);

  if (String(sheet.specie).trim().toLocaleLowerCase("it") === "elfo alto") {
    sheet.specie = "Elfo";
    sheet.lignaggio = "Elfo alto";
  } else sheet.specie = choose(sheet.specie, regole.specie, `${name} specie`);
  sheet.lignaggio = choose(sheet.lignaggio, regole.lignaggi[sheet.specie] ?? [], `${name} lignaggio`);
  sheet.background = choose(sheet.background, regole.background, `${name} background`);
  if (String(sheet.allineamento).trim().toLocaleLowerCase("it") === "neutrale legale") sheet.allineamento = "Legale neutrale";
  sheet.allineamento = choose(sheet.allineamento, regole.allineamenti, `${name} allineamento`);
  if (String(sheet.taglia).trim().toLocaleLowerCase("it") === "m") sheet.taglia = "Media";
  sheet.taglia = choose(sheet.taglia, regole.taglie, `${name} taglia`);

  const oldSpeed = sheet.velocita;
  const speedMatch = typeof oldSpeed === "string" ? oldSpeed.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:m|m\/s|metri)?$/i) : null;
  if (typeof oldSpeed === "number" && Number.isFinite(oldSpeed)) sheet.velocita = String(oldSpeed);
  else if (speedMatch) sheet.velocita = String(Number(speedMatch[1].replace(",", ".")));
  else if (!oldSpeed) sheet.velocita = "";
  else errors.push(`${name} velocità: ${JSON.stringify(oldSpeed)}`);

  sheet.noteLingue ??= "";
  sheet.lingue = list(sheet.lingue).map((rawLanguage) => {
    let language = rawLanguage.replace(/\s*\(da [^)]+\)\s*$/i, "").trim();
    if (language.toLocaleLowerCase("it") === "sottocomune mercanti") language = "Sottocomune";
    if (language !== rawLanguage && !sheet.noteLingue.includes(rawLanguage)) {
      sheet.noteLingue += `${sheet.noteLingue ? "\n" : ""}${rawLanguage}`;
    }
    return choose(language, allLanguages, `${name} lingua`);
  });
  sheet.competenzeArmi = list(sheet.competenzeArmi).map((value) => {
    if (String(value).trim().toLocaleLowerCase("it") === "semplici") value = "Armi semplici";
    if (String(value).trim().toLocaleLowerCase("it") === "da guerra") value = "Armi da guerra";
    return choose(value, [...regole.competenzeArmi, ...allWeapons], `${name} competenza armi`);
  });

  sheet.equipaggiamento ??= [];
  sheet.armi = (sheet.armi ?? []).flatMap((weapon) => {
    const original = String(weapon.nome ?? "").trim().toLocaleLowerCase("it");
    if (original === "frecce" || original === "frecce d'argento") {
      const label = original === "frecce" ? "Frecce" : "Frecce d'argento";
      const detail = [weapon.bonus && `Bonus: ${weapon.bonus}`, weapon.danno && `Danno: ${weapon.danno}`, weapon.gittata && `Gittata: ${weapon.gittata}`, weapon.note].filter(Boolean).join("; ");
      sheet.equipaggiamento.push({
        nome: `${label}${weapon.quantita ? ` x${weapon.quantita}` : ""}`,
        dettaglio: detail,
        provenienza: weapon.provenienza ?? "",
      });
      return [];
    }
    return [{ ...weapon, nome: choose(weapon.nome, allWeapons, `${name} arma`) }];
  });
  sheet.talenti = (sheet.talenti ?? []).map((feat) => {
    const match = String(feat.nome ?? "").trim().match(/^(.*?)\s*\((da [^)]+)\)$/i);
    const title = choose(match ? match[1] : feat.nome, allFeats, `${name} talento`);
    const provenance = match?.[2];
    return { ...feat, nome: title, descrizione: provenance && !feat.descrizione?.includes(provenance)
      ? `Provenienza: ${provenance}\n${feat.descrizione ?? ""}` : feat.descrizione ?? "" };
  });
  for (const spell of sheet.incantesimi ?? []) {
    choose(spell.livello, regole.livelliIncantesimo, `${name} livello incantesimo`);
  }
  return sheet;
}

const rows = (await client.execute("SELECT id, name, data FROM characters ORDER BY name")).rows;
const changes = rows.map((row) => {
  const oldData = String(row.data);
  const before = JSON.parse(oldData);
  const after = convert(before, String(row.name));
  const newData = JSON.stringify(after);
  const keys = ["classe", "sottoclasse", "specie", "lignaggio", "background", "allineamento", "taglia", "velocita", "lingue", "competenzeArmi"];
  const preview = Object.fromEntries(keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => [key, { prima: before[key] ?? null, dopo: after[key] ?? null }]));
  if (JSON.stringify(before.armi?.map((item) => item.nome)) !== JSON.stringify(after.armi?.map((item) => item.nome)))
    preview.armi = { prima: before.armi?.map((item) => item.nome), dopo: after.armi?.map((item) => item.nome) };
  if (JSON.stringify(before.talenti?.map((item) => item.nome)) !== JSON.stringify(after.talenti?.map((item) => item.nome)))
    preview.talenti = { prima: before.talenti?.map((item) => item.nome), dopo: after.talenti?.map((item) => item.nome) };
  return { id: String(row.id), name: String(row.name), oldData, newData, changed: oldData !== newData, preview };
});
if (errors.length) {
  console.error("Valori non riconosciuti:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", characters: changes.length,
    changed: changes.filter((row) => row.changed).map((row) => ({ name: row.name, fields: row.preview })) }, null, 2));
  if (apply && changes.some((row) => row.changed)) {
    const backupDir = path.join(process.cwd(), ".db-backups");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `domains-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await writeFile(backupPath, JSON.stringify(changes.map(({ id, name, oldData }) => ({ id, name, data: JSON.parse(oldData) })), null, 2));
    for (const row of changes.filter((item) => item.changed)) {
      const result = await client.execute({ sql: "UPDATE characters SET data = ? WHERE id = ? AND data = ?", args: [row.newData, row.id, row.oldData] });
      if (result.rowsAffected !== 1) throw new Error(`Dati cambiati durante la bonifica: ${row.name}`);
    }
    console.log(`Backup locale: ${backupPath}`);
  }
}
