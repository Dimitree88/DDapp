"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { abilityModifier } from "@/lib/abilityBonus";
import { diffSheet } from "@/lib/history";
import { spellSlots } from "@/lib/spellcasting";
import { hitDieSize, hitDiceTotal, rechargeResources, rechargeSpellSlots, type RestKind } from "@/lib/masterRest";
import { db } from "@/lib/db";
import { characterHistory, characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";
import { normalizeSheet, type CondizioneAttiva, type EventoStoria, type Sheet } from "@/lib/sheet";
import type { CreatureData } from "@/lib/creature";

const conditionNames = [
  "Accecato", "Affascinato", "Afferrato", "Assordato", "Avvelenato", "Incapacitato",
  "Invisibile", "Paralizzato", "Pietrificato", "Prono", "Privo di sensi", "Spaventato",
  "Stordito", "Trattenuto",
];

function fail(message: string): never {
  redirect(`/master?errore=${encodeURIComponent(message)}`);
}

function commandIdOf(formData: FormData) {
  const id = String(formData.get("commandId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Comando non valido. Ricarica la pagina e riprova.");
  return id;
}

function positiveInteger(value: FormDataEntryValue | null, label: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(`${label}: inserisci un intero maggiore di zero.`);
  return number;
}

function nonNegativeInteger(value: FormDataEntryValue | null, label: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`${label}: inserisci un intero pari o superiore a zero.`);
  return number;
}

function storyEvent(sessionName: string, title: string, details: string[], date: Date): EventoStoria {
  return { capitolo: `Sessione: ${sessionName}`, titolo: title, dettagli: details, data: date.toISOString() };
}

async function appendCharacterHistory(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], characterId: string, before: Sheet, after: Sheet, now: Date) {
  const changes = diffSheet(before, after);
  if (changes.length) await tx.insert(characterHistory).values({ id: randomUUID(), characterId, occurredAt: now, changes });
  return changes;
}

async function storeCharacter(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], id: string, before: Sheet, next: Sheet, now: Date) {
  const clean = normalizeSheet(next);
  const changes = await appendCharacterHistory(tx, id, before, clean, now);
  await tx.update(characters).set({ data: clean, updatedAt: now }).where(eq(characters.id, id));
  return { sheet: clean, changes };
}

async function requireOpenParticipant(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], sessionId: string, characterId: string) {
  const [session] = await tx.select({ id: masterSessions.id, name: masterSessions.name }).from(masterSessions)
    .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).limit(1);
  if (!session) throw new Error("La Sessione non è aperta.");
  const [participant] = await tx.select({ characterId: masterSessionParticipants.characterId }).from(masterSessionParticipants)
    .where(and(eq(masterSessionParticipants.sessionId, sessionId), eq(masterSessionParticipants.characterId, characterId))).limit(1);
  if (!participant) throw new Error("Il personaggio non è tra i partecipanti della Sessione.");
  return session;
}

export async function applyMasterCharacterAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const characterId = String(formData.get("characterId") ?? "");
  const action = String(formData.get("action") ?? "");
  const commandId = commandIdOf(formData);
  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      const [duplicate] = await tx.select({ id: masterSessionEvents.id }).from(masterSessionEvents).where(eq(masterSessionEvents.id, commandId)).limit(1);
      if (duplicate) return;
      const session = await requireOpenParticipant(tx, sessionId, characterId);
      const [row] = await tx.select().from(characters).where(eq(characters.id, characterId)).limit(1);
      if (!row) throw new Error("Personaggio non trovato.");
      const before = normalizeSheet(row.data);
      let next: Sheet = { ...before };
      let title = "";
      let details: string[] = [];
      let extra: Record<string, unknown> = {};

      if (action === "ispirazione-conferisci") {
        if (!before.ispirazioneEroica) {
          next.ispirazioneEroica = true;
          title = "Ispirazione eroica conferita";
          details = [String(formData.get("source") ?? "").trim() || "Fonte non annotata"];
        } else {
          const targetId = String(formData.get("targetId") ?? "");
          if (!targetId || targetId === characterId) throw new Error("Questo personaggio ha già Ispirazione. Se la nuova concessione va trasferita, scegli un altro partecipante idoneo.");
          const [targetParticipant] = await tx.select({ characterId: masterSessionParticipants.characterId }).from(masterSessionParticipants)
            .where(and(eq(masterSessionParticipants.sessionId, sessionId), eq(masterSessionParticipants.characterId, targetId))).limit(1);
          if (!targetParticipant) throw new Error("Il destinatario non è un partecipante della Sessione.");
          const [targetRow] = await tx.select().from(characters).where(eq(characters.id, targetId)).limit(1);
          if (!targetRow) throw new Error("Destinatario non trovato.");
          const targetBefore = normalizeSheet(targetRow.data);
          if (targetBefore.ispirazioneEroica) throw new Error("Il destinatario possiede già Ispirazione eroica.");
          const targetNext = normalizeSheet({ ...targetBefore, ispirazioneEroica: true, eventiStoria: [
            ...(targetBefore.eventiStoria ?? []), storyEvent(session.name, "Ispirazione eroica ricevuta", [`Trasferita da ${row.name}`], now),
          ] });
          const targetStored = await storeCharacter(tx, targetId, targetBefore, targetNext, now);
          next.eventiStoria = [...(before.eventiStoria ?? []), storyEvent(session.name, "Ispirazione eroica trasferita", [`Destinatario: ${targetRow.name}`], now)];
          title = "Ispirazione eroica conferita e trasferita";
          details = [`Da ${row.name} a ${targetRow.name}`];
          extra = { targetId, targetChanges: targetStored.changes };
        }
      } else if (action === "ispirazione-spendi") {
        if (!before.ispirazioneEroica) throw new Error("Il personaggio non possiede Ispirazione eroica.");
        next.ispirazioneEroica = false;
        title = "Ispirazione eroica spesa";
        details = [String(formData.get("source") ?? "").trim() || "Uso annotato dal Master"];
      } else if (action === "pf-registra") {
        const maximum = Number(before.puntiFeritaMax);
        const value = nonNegativeInteger(formData.get("amount"), "Punti ferita");
        if (!Number.isSafeInteger(maximum) || maximum < 1 || value > maximum) throw new Error("Registra prima i PF massimi validi; i PF attuali non possono superarli.");
        next.puntiFerita = String(value);
        next.statoMorte = value > 0 ? undefined : before.statoMorte ?? "tiri";
        title = "Punti ferita attuali registrati";
        details = [`${before.puntiFerita || "da registrare"} → ${value}`];
      } else if (action === "danni" || action === "guarigione") {
        const amount = positiveInteger(formData.get("amount"), action === "danni" ? "Danno" : "Guarigione");
        const current = Number(before.puntiFerita);
        const maximum = Number(before.puntiFeritaMax);
        if (!Number.isSafeInteger(current) || !Number.isSafeInteger(maximum) || maximum < 1 || current < 0 || current > maximum) throw new Error("PF attuali o massimi mancanti/non validi: registrali prima di applicare danni o guarigione.");
        if (action === "danni") {
          let temporary = Number(before.puntiFeritaTemporanei);
          if (!Number.isSafeInteger(temporary) || temporary < 0) {
            temporary = nonNegativeInteger(formData.get("tempCurrent"), "PF temporanei attuali");
          }
          let damage = amount;
          const temporaryLost = Math.min(temporary, damage);
          temporary -= temporaryLost;
          damage -= temporaryLost;
          next.puntiFeritaTemporanei = String(temporary);
          if (current === 0) {
            if (before.statoMorte === "morto") throw new Error("Il personaggio risulta morto.");
            if (damage > 0) {
              const saves = before.tiriMorte ?? { successi: 0, fallimenti: 0 };
              const critical = formData.get("critical") === "on";
              const failures = saves.fallimenti + (critical ? 2 : 1);
              next.tiriMorte = { ...saves, fallimenti: failures };
              if (damage >= maximum || failures >= 3) next.statoMorte = "morto";
              else next.statoMorte = "tiri";
            }
            title = "Danni subiti a 0 PF";
          } else {
            const remaining = Math.max(0, current - damage);
            next.puntiFerita = String(remaining);
            if (remaining === 0) {
              const overflow = Math.max(0, damage - current);
              next.tiriMorte = { successi: 0, fallimenti: 0 };
              next.statoMorte = overflow >= maximum ? "morto" : "tiri";
              if (next.statoMorte === "tiri" && !(next.condizioni ?? []).some((condition) => condition.nome === "Privo di sensi" && condition.fonte === "Punti ferita a 0")) {
                next.condizioni = [...(next.condizioni ?? []), { nome: "Privo di sensi", fonte: "Punti ferita a 0", durata: "Finché non recupera PF", nota: "" }];
              }
            }
            title = "Danni subiti";
          }
          details = [`Danno già determinato al tavolo: ${amount}`, `PF temporanei persi: ${temporaryLost}`, `PF: ${current} → ${next.puntiFerita}`, ...(next.statoMorte ? [`Stato: ${next.statoMorte}`] : [])];
          const source = String(formData.get("source") ?? "").trim();
          if (source) details.push(`Fonte/nota: ${source}`);
        } else {
          if (before.statoMorte === "morto") throw new Error("Il personaggio risulta morto.");
          const healed = Math.min(maximum, current + amount);
          next.puntiFerita = String(healed);
          if (healed > 0 && current === 0) {
            next.statoMorte = undefined;
            next.tiriMorte = { successi: 0, fallimenti: 0 };
            next.condizioni = (next.condizioni ?? []).filter((condition) => !(condition.nome === "Privo di sensi" && condition.fonte === "Punti ferita a 0"));
          }
          title = "Guarigione";
          details = [`PF: ${current} → ${healed}`];
        }
      } else if (action === "pf-temporanei") {
        const amount = nonNegativeInteger(formData.get("amount"), "PF temporanei");
        const current = Number(before.puntiFeritaTemporanei);
        if (Number.isSafeInteger(current) && current > 0 && formData.get("choice") === "mantieni") {
          next.puntiFeritaTemporanei = String(current);
          details = [`Conservati ${current}; non si sommano ai nuovi ${amount}`];
        } else if (Number.isSafeInteger(current) && current > 0 && formData.get("choice") !== "sostituisci") {
          throw new Error("Scegli se conservare i PF temporanei attuali o sostituirli con i nuovi.");
        } else {
          next.puntiFeritaTemporanei = String(amount);
          details = [`PF temporanei: ${Number.isSafeInteger(current) ? current : "da registrare"} → ${amount}`];
        }
        title = "PF temporanei aggiornati";
      } else if (action === "tiro-morte") {
        if (Number(before.puntiFerita) !== 0 || before.statoMorte === "morto" || before.statoMorte === "stabile") throw new Error("Il personaggio non deve effettuare tiri salvezza contro morte.");
        const roll = nonNegativeInteger(formData.get("amount"), "Risultato del tiro");
        if (roll < 1 || roll > 20) throw new Error("Il tiro deve essere compreso tra 1 e 20.");
        const saves = before.tiriMorte ?? { successi: 0, fallimenti: 0 };
        let successes = saves.successi;
        let failures = saves.fallimenti;
        if (roll === 1) failures += 2;
        else if (roll === 20) {
          next.puntiFerita = "1";
          next.tiriMorte = { successi: 0, fallimenti: 0 };
          next.statoMorte = undefined;
          next.condizioni = (next.condizioni ?? []).filter((condition) => !(condition.nome === "Privo di sensi" && condition.fonte === "Punti ferita a 0"));
        } else if (roll >= 10) successes += 1;
        else failures += 1;
        if (roll !== 20) {
          next.tiriMorte = { successi: successes, fallimenti: failures };
          next.statoMorte = failures >= 3 ? "morto" : successes >= 3 ? "stabile" : "tiri";
        }
        title = "Tiro salvezza contro morte";
        details = [`Risultato: ${roll}`, `Successi ${next.tiriMorte?.successi ?? 0}; fallimenti ${next.tiriMorte?.fallimenti ?? 0}`, `Esito: ${next.statoMorte ?? "recupera 1 PF"}`];
      } else if (action === "stabilizza") {
        if (Number(before.puntiFerita) !== 0 || before.statoMorte === "morto") throw new Error("Puoi stabilizzare solo un personaggio vivo a 0 PF.");
        next.statoMorte = "stabile";
        next.tiriMorte = { successi: 0, fallimenti: 0 };
        if (!(next.condizioni ?? []).some((condition) => condition.nome === "Privo di sensi" && condition.fonte === "Punti ferita a 0")) {
          next.condizioni = [...(next.condizioni ?? []), { nome: "Privo di sensi", fonte: "Punti ferita a 0", durata: "Finché non recupera PF", nota: "" }];
        }
        title = "Personaggio stabilizzato";
        details = ["Esito della stabilizzazione confermato dal Master"];
      } else if (action === "condizione-aggiungi") {
        const name = String(formData.get("condition") ?? "");
        if (!conditionNames.includes(name)) throw new Error("Condizione non valida.");
        const condition: CondizioneAttiva = {
          nome: name,
          fonte: String(formData.get("source") ?? "").trim(),
          durata: String(formData.get("duration") ?? "").trim(),
          nota: String(formData.get("note") ?? "").trim(),
        };
        if (!condition.fonte) throw new Error("Indica la fonte della condizione.");
        next.condizioni = [...(next.condizioni ?? []), condition];
        title = `Condizione aggiunta: ${name}`;
        details = [condition.fonte, condition.durata || "Durata non annotata", condition.nota].filter(Boolean);
      } else if (action === "condizione-rimuovi") {
        const index = nonNegativeInteger(formData.get("conditionIndex"), "Condizione");
        if (index >= (before.condizioni?.length ?? 0)) throw new Error("Condizione non trovata.");
        const [removed] = before.condizioni!.filter((_, i) => i === index);
        next.condizioni = before.condizioni!.filter((_, i) => i !== index);
        title = `Condizione rimossa: ${removed.nome}`;
        details = [removed.fonte, removed.durata, removed.nota].filter(Boolean);
      } else if (action === "indebolimento-su" || action === "indebolimento-giu") {
        if (!Number.isInteger(before.indebolimento)) throw new Error("Livello di Indebolimento non registrato: impostalo prima di modificarlo.");
        const nextLevel = before.indebolimento! + (action === "indebolimento-su" ? 1 : -1);
        if (nextLevel < 0 || nextLevel > 6) throw new Error("Il livello di Indebolimento deve rimanere tra 0 e 6.");
        next.indebolimento = nextLevel;
        if (nextLevel === 6) next.statoMorte = "morto";
        title = "Indebolimento aggiornato";
        details = [`Livello: ${before.indebolimento} → ${nextLevel}`, String(formData.get("note") ?? "").trim()].filter(Boolean);
      } else if (action === "indebolimento-registra") {
        const level = nonNegativeInteger(formData.get("amount"), "Indebolimento");
        if (level > 6) throw new Error("Indebolimento deve essere compreso tra 0 e 6.");
        next.indebolimento = level;
        if (level === 6) next.statoMorte = "morto";
        title = "Livello di Indebolimento registrato";
        details = [`Livello: ${level}`, String(formData.get("source") ?? "").trim()].filter(Boolean);
      } else if (action === "concentrazione-imposta") {
        const effect = String(formData.get("effect") ?? "").trim();
        const source = String(formData.get("source") ?? "").trim();
        if (!effect || !source) throw new Error("Indica effetto e fonte della concentrazione.");
        next.concentrazione = { effetto: effect, fonte: source, durata: String(formData.get("duration") ?? "").trim() };
        title = "Concentrazione registrata";
        details = [effect, source, next.concentrazione.durata].filter(Boolean);
      } else if (action === "concentrazione-termina") {
        if (!before.concentrazione) throw new Error("Non risulta una concentrazione attiva.");
        details = [before.concentrazione.effetto, before.concentrazione.fonte];
        next.concentrazione = undefined;
        title = "Concentrazione terminata al tavolo";
      } else if (action === "risorsa-usa") {
        const index = nonNegativeInteger(formData.get("resourceIndex"), "Risorsa");
        const resource = before.risorse?.[index];
        if (!resource) throw new Error("Risorsa non trovata.");
        if (resource.spesi >= resource.massimo) throw new Error(`${resource.nome}: tutti gli utilizzi sono già spesi.`);
        next.risorse = before.risorse!.map((item, i) => i === index ? { ...item, spesi: item.spesi + 1 } : item);
        title = `Risorsa usata: ${resource.nome}`;
        details = [`Fonte: ${resource.fonte}`, `Utilizzi spesi: ${resource.spesi} → ${resource.spesi + 1}`];
      } else if (action === "slot-usa") {
        const level = positiveInteger(formData.get("slotLevel"), "Livello dello slot");
        const slot = spellSlots(before).find((item) => item.level === level);
        if (!slot || slot.maximum < 1) throw new Error("Slot non disponibile.");
        const spent = Number(before.slotSpesi?.[String(level)] ?? 0);
        if (spent >= slot.maximum) throw new Error("Tutti gli slot di questo livello sono già spesi.");
        next.slotSpesi = { ...(before.slotSpesi ?? {}), [String(level)]: spent + 1 };
        title = `Slot di livello ${level} usato`;
        details = [`Slot spesi: ${spent} → ${spent + 1}`];
      } else {
        throw new Error("Azione Master non riconosciuta.");
      }

      next = normalizeSheet({ ...next, eventiStoria: [...(next.eventiStoria ?? []), storyEvent(session.name, title, details, now)] });
      const stored = await storeCharacter(tx, characterId, before, next, now);
      await tx.insert(masterSessionEvents).values({ id: commandId, sessionId, characterId, type: action, occurredAt: now, payload: { characterName: row.name, title, details, changes: stored.changes, ...extra } });
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail(error instanceof Error ? error.message : "Impossibile registrare l'azione.");
  }
  revalidatePath("/master");
  revalidatePath(`/personaggio/${characterId}`);
  redirect("/master");
}

function previousLongRest(sheet: Sheet): number | null {
  const rest = [...(sheet.eventiStoria ?? [])].reverse().find((event) => /riposo lungo/i.test(event.titolo));
  if (!rest) return null;
  const timestamp = Date.parse(rest.data);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function restStory(kind: RestKind, now: Date, name: string, summary: string[]) {
  return storyEvent(name, kind === "breve" ? "Riposo breve completato" : "Riposo lungo completato", summary, now);
}

export async function applyMasterGroupRest(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const commandId = commandIdOf(formData);
  const kind = String(formData.get("restKind") ?? "") as RestKind;
  if (kind !== "breve" && kind !== "lungo") fail("Tipo di riposo non valido.");
  const characterIds = [...new Set(formData.getAll("character").map(String))];
  const creatureIds = [...new Set(formData.getAll("creature").map(String))];
  if (!characterIds.length && !creatureIds.length) fail("Seleziona almeno un partecipante al riposo.");
  if (formData.get("completed") !== "on") fail("Conferma che il riposo sia stato completato e non interrotto.");
  if (kind === "lungo" && formData.get("confirm16hours") !== "on") fail("Conferma che i partecipanti rispettino l'intervallo minimo del riposo lungo.");
  const rollsById = new Map(characterIds.map((id) => [id, String(formData.get(`hitDice-${id}`) ?? "").trim()]));
  const spentById = new Map(characterIds.map((id) => [id, String(formData.get(`spentDice-${id}`) ?? "").trim()]));
  const transferById = new Map(characterIds.map((id) => [id, String(formData.get(`inspirationTarget-${id}`) ?? "")]));
  const inspirationTransfers: { targetId: string; sourceName: string }[] = [];
  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      const [duplicate] = await tx.select({ id: masterSessionEvents.id }).from(masterSessionEvents).where(eq(masterSessionEvents.id, commandId)).limit(1);
      if (duplicate) return;
      const [session] = await tx.select({ id: masterSessions.id, name: masterSessions.name }).from(masterSessions)
        .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).limit(1);
      if (!session) throw new Error("La Sessione non è aperta.");
      const chars = characterIds.length ? await tx.select().from(characters) : [];
      const charMap = new Map(chars.map((row) => [row.id, row]));
      const charParticipants = characterIds.length ? await tx.select({ id: masterSessionParticipants.characterId }).from(masterSessionParticipants)
        .where(eq(masterSessionParticipants.sessionId, sessionId)) : [];
      const allowedChars = new Set(charParticipants.map(({ id }) => id));
      if (characterIds.some((id) => !allowedChars.has(id))) throw new Error("La selezione include un personaggio assente dalla Sessione.");
      const beasts = creatureIds.length ? await tx.select().from(creatures) : [];
      const beastMap = new Map(beasts.map((row) => [row.id, row]));
      const beastParticipants = creatureIds.length ? await tx.select({ id: masterSessionCreatures.creatureId }).from(masterSessionCreatures)
        .where(eq(masterSessionCreatures.sessionId, sessionId)) : [];
      const allowedBeasts = new Set(beastParticipants.map(({ id }) => id));
      if (creatureIds.some((id) => !allowedBeasts.has(id))) throw new Error("La selezione include una creatura non presente nella Sessione.");
      const prepared: { id: string; row: typeof chars[number]; before: Sheet; after: Sheet; title: string; details: string[] }[] = [];
      for (const id of characterIds) {
        const row = charMap.get(id);
        if (!row) throw new Error("Personaggio non trovato.");
        const before = normalizeSheet(row.data);
        const currentHp = Number(before.puntiFerita);
        const maxHp = Number(before.puntiFeritaMax);
        if (!Number.isInteger(currentHp) || currentHp < 1) throw new Error(`${row.name}: PF attuali mancanti o inferiori a 1; il riposo non può essere registrato.`);
        if (!Number.isInteger(maxHp) || maxHp < currentHp) throw new Error(`${row.name}: PF massimi mancanti o non validi.`);
        if (kind === "lungo") {
          const last = previousLongRest(before);
          if (last !== null && now.getTime() - last < 16 * 60 * 60 * 1000) throw new Error(`${row.name}: non sono ancora trascorse 16 ore dall'ultimo riposo lungo registrato.`);
        }
        let after: Sheet = { ...before };
        const details: string[] = [];
        if (kind === "breve") {
          const rollText = rollsById.get(id) ?? "";
          if (rollText) {
            const dieSize = hitDieSize(before);
            const totalDice = hitDiceTotal(before);
            if (!dieSize || !totalDice) throw new Error(`${row.name}: Dadi Vita non registrati o non validi.`);
            const existingSpent = Number(before.dadiVitaSpesi);
            let spent = existingSpent;
            if (!Number.isInteger(spent) || spent < 0) {
              const suppliedText = spentById.get(id) ?? "";
              if (!suppliedText) throw new Error(`${row.name}: registra quanti Dadi Vita erano già spesi.`);
              const supplied = Number(suppliedText);
              if (!Number.isInteger(supplied) || supplied < 0) throw new Error(`${row.name}: registra quanti Dadi Vita erano già spesi.`);
              spent = supplied;
            }
            const rolls = rollText.split(/[\s,;]+/).filter(Boolean).map(Number);
            if (rolls.some((roll) => !Number.isInteger(roll) || roll < 1 || roll > dieSize)) throw new Error(`${row.name}: ogni risultato deve essere tra 1 e ${dieSize}.`);
            if (rolls.length > totalDice - spent) throw new Error(`${row.name}: non ha abbastanza Dadi Vita disponibili.`);
            const constitution = Number(abilityModifier(before.caratteristiche.find((ability) => ability.abbr === "COS")?.valore ?? ""));
            const recovery = rolls.reduce((sum, roll) => sum + Math.max(1, roll + (Number.isFinite(constitution) ? constitution : 0)), 0);
            after.puntiFerita = String(Math.min(maxHp, currentHp + recovery));
            after.dadiVitaSpesi = String(spent + rolls.length);
            if (Number(after.puntiFerita) > 0 && currentHp === 0) {
              after.tiriMorte = { successi: 0, fallimenti: 0 };
              after.statoMorte = undefined;
            }
            details.push(`Dadi Vita spesi: ${rolls.length}; PF recuperati: ${Number(after.puntiFerita) - currentHp}`);
          }
        } else {
          after.puntiFerita = String(maxHp);
          after.puntiFeritaTemporanei = "0";
          after.dadiVitaSpesi = "0";
          if (before.indebolimento !== undefined) after.indebolimento = Math.max(0, before.indebolimento - 1);
          after.risorse = rechargeResources(before.risorse ?? [], "lungo");
          after.slotSpesi = rechargeSpellSlots(before, "lungo");
          if (before.indebolimento === undefined) details.push("Indebolimento precedente non registrato: nessuna riduzione applicata.");
          else if (after.indebolimento !== before.indebolimento) details.push(`Indebolimento: ${before.indebolimento} → ${after.indebolimento}`);
          if (before.puntiFerita !== after.puntiFerita) details.push(`PF: ${before.puntiFerita} → ${after.puntiFerita}`);
          if (before.dadiVitaSpesi !== "0") details.push(`Dadi Vita spesi: ${before.dadiVitaSpesi ?? "da registrare"} → 0`);
          if (before.puntiFeritaTemporanei !== "0") details.push(`PF temporanei: ${before.puntiFeritaTemporanei ?? "da registrare"} → 0`);
          if (before.specie === "Umano" && !before.ispirazioneEroica) {
            after.ispirazioneEroica = true;
            details.push("Ispirazione eroica conferita da Intraprendente.");
          } else if (before.specie === "Umano" && before.ispirazioneEroica) {
            const targetId = transferById.get(id);
            if (targetId && targetId !== id && characterIds.includes(targetId)) {
              const target = charMap.get(targetId);
              if (!target) throw new Error("Destinatario dell'Ispirazione non trovato.");
              const targetBefore = normalizeSheet(target.data);
              if (targetBefore.ispirazioneEroica) throw new Error(`${target.name} possiede già Ispirazione eroica.`);
              inspirationTransfers.push({ targetId, sourceName: row.name });
              details.push(`Ispirazione eroica trasferita a ${target.name}.`);
            } else details.push("Intraprendente: la nuova Ispirazione non si accumula; nessun destinatario scelto.");
          }
        }
        after.risorse = rechargeResources(after.risorse ?? before.risorse ?? [], kind);
        after.slotSpesi = rechargeSpellSlots(after, kind);
        const recoveredResources = (before.risorse ?? []).flatMap((resource, index) => {
          const recovered = (after.risorse ?? [])[index];
          return recovered && recovered.spesi < resource.spesi ? [`${resource.nome}: ${resource.spesi} → ${recovered.spesi}`] : [];
        });
        if (recoveredResources.length) details.push(`Risorse recuperate: ${recoveredResources.join("; ")}`);
        const slotRecoveries = Object.entries(before.slotSpesi ?? {}).flatMap(([level, spent]) => (after.slotSpesi?.[level] ?? 0) < spent ? [`livello ${level}: ${spent} → 0`] : []);
        if (slotRecoveries.length) details.push(`Slot recuperati: ${slotRecoveries.join("; ")}`);
        if (!details.length) details.push(kind === "breve" ? "Riposo completato; nessun recupero selezionato." : "Benefici del riposo lungo applicati.");
        after.eventiStoria = [...(after.eventiStoria ?? []), restStory(kind, now, session.name, details)];
        prepared.push({ id, row, before, after: normalizeSheet(after), title: kind === "breve" ? "Riposo breve completato" : "Riposo lungo completato", details });
      }
      for (const transfer of inspirationTransfers) {
        const target = prepared.find((item) => item.id === transfer.targetId);
        if (!target) throw new Error("Il destinatario dell'Ispirazione deve essere selezionato nel riposo.");
        if (target.before.ispirazioneEroica) throw new Error(`${target.row.name} possiede già Ispirazione eroica.`);
        target.after.ispirazioneEroica = true;
        target.after.eventiStoria = [...(target.after.eventiStoria ?? []), storyEvent(session.name, "Ispirazione eroica ricevuta dopo un riposo lungo", [`Trasferita da ${transfer.sourceName}`], now)];
        target.details.push(`Ispirazione eroica ricevuta da ${transfer.sourceName}.`);
      }
      const preparedCreatures: { id: string; row: typeof beasts[number]; data: CreatureData; before: CreatureData; details: string[] }[] = [];
      for (const id of creatureIds) {
        const row = beastMap.get(id);
        if (!row) throw new Error("Creatura non trovata.");
        const before = row.data;
        if (!Number.isInteger(before.hitPointsCurrent) || before.hitPointsCurrent < 1) throw new Error(`${row.name}: PF attuali inferiori a 1 o non validi; il riposo non può essere registrato.`);
        if (!Number.isInteger(before.hitPointsMax) || before.hitPointsMax < before.hitPointsCurrent) throw new Error(`${row.name}: PF massimi non validi.`);
        const data = kind === "lungo" ? { ...before, hitPointsCurrent: before.hitPointsMax } : { ...before };
        const details = kind === "lungo" && before.hitPointsCurrent !== data.hitPointsCurrent
          ? [`PF: ${before.hitPointsCurrent} → ${data.hitPointsCurrent}`]
          : ["Riposo completato; nessun Dado Vita o recupero specifico registrato per questa creatura." ];
        preparedCreatures.push({ id, row, before, data, details });
      }
      const summary: Record<string, unknown>[] = [];
      for (const item of prepared) {
        const stored = await storeCharacter(tx, item.id, item.before, item.after, now);
        const eventId = `${commandId}:${item.id}`;
        await tx.insert(masterSessionEvents).values({ id: eventId, sessionId, characterId: item.id, type: `riposo_${kind}`, occurredAt: now, payload: { characterName: item.row.name, before: item.before, after: item.after, details: item.details, changes: stored.changes } });
        summary.push({ characterId: item.id, name: item.row.name, details: item.details });
      }
      for (const item of preparedCreatures) {
        await tx.update(creatures).set({ data: item.data, updatedAt: now }).where(eq(creatures.id, item.id));
        await tx.insert(masterSessionEvents).values({ id: `${commandId}:creature:${item.id}`, sessionId, creatureId: item.id, type: `riposo_${kind}`, occurredAt: now, payload: { creatureName: item.row.name, before: item.before, after: item.data, details: item.details } });
        summary.push({ creatureId: item.id, name: item.row.name, details: item.details });
      }
      await tx.insert(masterSessionEvents).values({ id: commandId, sessionId, type: `riposo_${kind}_gruppo`, occurredAt: now, payload: { participants: summary } });
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail(error instanceof Error ? error.message : "Impossibile applicare il riposo.");
  }
  revalidatePath("/master");
  revalidatePath("/");
  redirect("/master");
}

export async function applyMasterCreatureAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const creatureId = String(formData.get("creatureId") ?? "");
  const commandId = commandIdOf(formData);
  const action = String(formData.get("action") ?? "");
  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      const [duplicate] = await tx.select({ id: masterSessionEvents.id }).from(masterSessionEvents).where(eq(masterSessionEvents.id, commandId)).limit(1);
      if (duplicate) return;
      const [session] = await tx.select({ id: masterSessions.id }).from(masterSessions)
        .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).limit(1);
      if (!session) throw new Error("La Sessione non è aperta.");
      const [member] = await tx.select({ id: masterSessionCreatures.creatureId }).from(masterSessionCreatures)
        .where(and(eq(masterSessionCreatures.sessionId, sessionId), eq(masterSessionCreatures.creatureId, creatureId))).limit(1);
      if (!member) throw new Error("La creatura non è tra i partecipanti della Sessione.");
      const [row] = await tx.select().from(creatures).where(eq(creatures.id, creatureId)).limit(1);
      if (!row) throw new Error("Creatura non trovata.");
      const before = row.data;
      const current = before.hitPointsCurrent;
      const max = before.hitPointsMax;
      const amount = action === "pf-registra" ? nonNegativeInteger(formData.get("amount"), "Punti ferita") : positiveInteger(formData.get("amount"), action === "danni" ? "Danno" : "Guarigione");
      if (!Number.isInteger(current) || !Number.isInteger(max) || max < 1 || current < 0 || current > max) throw new Error("PF della creatura non validi.");
      if (action === "pf-registra" && amount > max) throw new Error("I PF non possono superare il massimo.");
      if (!["pf-registra", "danni", "guarigione"].includes(action)) throw new Error("Azione creatura non valida.");
      const next = { ...before, hitPointsCurrent: action === "pf-registra" ? amount : action === "danni" ? Math.max(0, current - amount) : Math.min(max, current + amount) };
      await tx.update(creatures).set({ data: next, updatedAt: now }).where(eq(creatures.id, creatureId));
      await tx.insert(masterSessionEvents).values({
        id: commandId, sessionId, creatureId, type: `creatura_${action}`, occurredAt: now,
        payload: { creatureName: row.name, before, after: next, note: String(formData.get("note") ?? "").trim() },
      });
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    fail(error instanceof Error ? error.message : "Impossibile aggiornare la creatura.");
  }
  revalidatePath("/master");
  revalidatePath(`/creatura/${creatureId}`);
  redirect("/master");
}
