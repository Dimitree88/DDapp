"use server";

import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { characters, creatures, masterSessionEvents } from "@/lib/db/schema";
import { normalizeCreature, type CreatureData } from "@/lib/creature";
import {
  cleanText, errorResult, fail, loadParticipantCharacter, loadParticipantCreature, nonNegativeInt, positiveInt,
  requireCommandId, requireOpenSession, runCommand, storeCharacter, storyEvent, type ActionResult, type TargetChange, type UndoTarget,
} from "@/lib/masterCommand";
import { hitDieSize, hitDiceTotal, rechargeResources, rechargeSpellSlots } from "@/lib/masterRest";
import {
  addCondition, conditionNames, damageCharacter, damageCreature, deathSave, exhaustionEffects, healCharacter, healCreature,
  levelForXp, setTemporaryHp, stabilize, xpThresholds, type DeathSaveOutcome,
} from "@/lib/masterRules";
import { applyCreatureHpState, applyHpState, applySheetPatch, creatureHpState, sheetHpState, sheetPatch, stableJson } from "@/lib/masterView";
import { normalizeSheet, type CondizioneAttiva, type Sheet } from "@/lib/sheet";
import { spellSlots } from "@/lib/spellcasting";
import { abilityModifier } from "@/lib/abilityBonus";

function done(result: ActionResult, paths: string[] = []) {
  if (result.ok) {
    for (const path of paths) revalidatePath(path);
    refresh();
  }
  return result;
}

function conditionInput(input: Record<string, unknown>): CondizioneAttiva {
  const name = String(input.condition ?? "");
  if (!(conditionNames as readonly string[]).includes(name)) fail("Condizione non valida.");
  return { nome: name, fonte: cleanText(input.source, 200), durata: cleanText(input.duration, 200), nota: cleanText(input.note, 500) };
}

export type CharacterCommandInput = { sessionId: string; characterId: string; commandId: string; action: string } & Record<string, unknown>;

export async function characterCommand(input: CharacterCommandInput): Promise<ActionResult> {
  const sessionId = String(input.sessionId ?? "");
  const characterId = String(input.characterId ?? "");
  let commandId: string;
  try { commandId = requireCommandId(input.commandId); } catch (error) { return errorResult(error); }
  const action = String(input.action ?? "");
  const result = await runCommand(sessionId, commandId, async (tx) => {
    const { id, name, sheet: before } = await loadParticipantCharacter(tx, sessionId, characterId);
    let after: Sheet = { ...before };
    let title = "";
    let details: string[] = [];
    let warnings: string[] = [];
    const extraTargets: TargetChange[] = [];
    const hp = () => sheetHpState(before);

    if (action === "danni") {
      const amount = positiveInt(input.amount, "Danno");
      const outcome = damageCharacter(hp(), amount, input.critical === true);
      after = applyHpState(before, outcome.next);
      title = `Danni: ${amount}${input.critical === true ? " (critico)" : ""}`;
      details = [...outcome.details, ...(cleanText(input.source) ? [`Fonte: ${cleanText(input.source)}`] : [])];
      warnings = outcome.warnings;
    } else if (action === "guarigione") {
      const amount = positiveInt(input.amount, "Guarigione");
      const outcome = healCharacter(hp(), amount);
      after = applyHpState(before, outcome.next);
      title = `Guarigione: ${amount}`;
      details = outcome.details;
    } else if (action === "pf-temporanei") {
      const amount = nonNegativeInt(input.amount, "PF temporanei", 10000);
      const outcome = setTemporaryHp(hp(), amount, input.keep === true);
      after = applyHpState(before, outcome.next);
      title = "PF temporanei";
      details = outcome.details;
    } else if (action === "pf-registra") {
      const max = Number(before.puntiFeritaMax);
      const value = nonNegativeInt(input.amount, "Punti ferita");
      if (!Number.isSafeInteger(max) || max < 1 || value > max) fail("I PF attuali non possono superare i PF massimi registrati.");
      after.puntiFerita = String(value);
      if (value > 0) { delete after.statoMorte; after.tiriMorte = { successi: 0, fallimenti: 0 }; }
      else after.statoMorte = before.statoMorte ?? "tiri";
      title = "PF attuali corretti";
      details = [`PF: ${before.puntiFerita || "da registrare"} → ${value}`];
    } else if (action === "tiro-morte") {
      const outcome = String(input.outcome ?? "") as DeathSaveOutcome;
      if (!["successo", "fallimento", "uno", "venti"].includes(outcome)) fail("Esito del tiro non valido.");
      const result = deathSave(hp(), outcome);
      after = applyHpState(before, result.next);
      title = "Tiro salvezza contro morte";
      details = result.details;
    } else if (action === "stabilizza") {
      const result = stabilize(hp());
      after = applyHpState(before, result.next);
      title = "Personaggio stabilizzato";
      details = result.details;
    } else if (action === "condizione-aggiungi") {
      const condition = conditionInput(input);
      const result = addCondition(before.condizioni ?? [], before.concentrazione, condition);
      after.condizioni = result.conditions;
      if (result.concentration) after.concentrazione = result.concentration; else delete after.concentrazione;
      title = `Condizione: ${condition.nome}`;
      details = result.details;
    } else if (action === "condizione-rimuovi") {
      const index = nonNegativeInt(input.index, "Condizione");
      const removed = before.condizioni?.[index];
      if (!removed) fail("Condizione non trovata: ricarica la pagina.");
      after.condizioni = before.condizioni!.filter((_, i) => i !== index);
      title = `Condizione rimossa: ${removed!.nome}`;
      details = [removed!.fonte, removed!.durata].filter(Boolean);
    } else if (action === "indebolimento") {
      const level = nonNegativeInt(input.level, "Indebolimento", 6);
      const previous = before.indebolimento ?? 0;
      if (level === previous) return null;
      after.indebolimento = level;
      const effects = exhaustionEffects(level);
      title = `Indebolimento ${previous} → ${level}`;
      details = level ? [`Prove con d20 ${effects.d20}; velocità −${String(effects.speedMeters).replace(".", ",")} m (p. 366)`] : ["Condizione terminata (p. 366)"];
      if (effects.dead) {
        after.statoMorte = "morto";
        details.push("Livello 6: il personaggio muore (p. 366)");
        if (before.concentrazione) { delete after.concentrazione; details.push("Concentrazione terminata (p. 364)"); }
      }
    } else if (action === "concentrazione-imposta") {
      const effect = cleanText(input.effect, 200);
      if (!effect) fail("Indica l'effetto su cui si concentra.");
      after.concentrazione = { effetto: effect, fonte: cleanText(input.source, 200), durata: cleanText(input.duration, 200) };
      title = `Concentrazione: ${effect}`;
      details = [after.concentrazione.durata, ...(before.concentrazione ? [`Sostituisce ${before.concentrazione.effetto} (p. 364)`] : [])].filter(Boolean);
    } else if (action === "concentrazione-termina") {
      if (!before.concentrazione) fail("Non risulta una concentrazione attiva.");
      delete after.concentrazione;
      title = `Concentrazione terminata: ${before.concentrazione!.effetto}`;
    } else if (action === "ispirazione-conferisci") {
      if (before.ispirazioneEroica) fail("Possiede già Ispirazione eroica: non si accumula. Puoi trasferire la nuova concessione a un altro personaggio (p. 13).");
      after.ispirazioneEroica = true;
      title = "Ispirazione eroica conferita";
      details = cleanText(input.source) ? [cleanText(input.source)] : [];
    } else if (action === "ispirazione-spendi") {
      if (!before.ispirazioneEroica) fail("Il personaggio non possiede Ispirazione eroica.");
      after.ispirazioneEroica = false;
      title = "Ispirazione eroica spesa";
    } else if (action === "ispirazione-trasferisci") {
      const targetId = String(input.targetId ?? "");
      if (!targetId || targetId === characterId) fail("Scegli un altro partecipante.");
      const target = await loadParticipantCharacter(tx, sessionId, targetId);
      if (target.sheet.ispirazioneEroica) fail(`${target.name} possiede già Ispirazione eroica.`);
      extraTargets.push({ kind: "pg", id: target.id, name: target.name, before: target.sheet, after: { ...target.sheet, ispirazioneEroica: true } });
      title = "Ispirazione eroica trasferita";
      details = [`Nuova concessione per ${name}, che la possiede già: passa a ${target.name} (p. 13)`];
    } else if (action === "risorsa") {
      const index = nonNegativeInt(input.index, "Risorsa");
      const delta = input.delta === -1 ? -1 : 1;
      const resource = before.risorse?.[index];
      if (!resource) fail("Risorsa non trovata.");
      const spent = resource!.spesi + delta;
      if (spent < 0 || spent > resource!.massimo) fail(delta > 0 ? `${resource!.nome}: utilizzi esauriti.` : `${resource!.nome}: nessun utilizzo da ripristinare.`);
      after.risorse = before.risorse!.map((item, i) => i === index ? { ...item, spesi: spent } : item);
      title = delta > 0 ? `${resource!.nome}: usata` : `${resource!.nome}: utilizzo ripristinato (correzione)`;
      details = [`Utilizzi spesi ${resource!.spesi} → ${spent} su ${resource!.massimo}`];
    } else if (action === "slot") {
      const level = positiveInt(input.level, "Livello dello slot", 9);
      const delta = input.delta === -1 ? -1 : 1;
      const slot = spellSlots(before).find((item) => item.level === level);
      if (!slot || slot.maximum < 1) fail("Slot non disponibile.");
      const spent = slot!.spent + delta;
      if (spent < 0 || spent > slot!.maximum) fail(delta > 0 ? "Tutti gli slot di questo livello sono spesi." : "Nessuno slot da ripristinare.");
      after.slotSpesi = { ...(before.slotSpesi ?? {}), [String(level)]: spent };
      title = delta > 0 ? `Slot di ${level}° livello usato` : `Slot di ${level}° livello ripristinato (correzione)`;
      details = [`Slot spesi ${slot!.spent} → ${spent} su ${slot!.maximum}`];
    } else fail("Azione non riconosciuta.");

    return { type: action, title, details, warnings, targets: [{ kind: "pg", id, name, before, after }, ...extraTargets] };
  });
  return done(result, [`/personaggio/${characterId}`, ...(typeof input.targetId === "string" ? [`/personaggio/${input.targetId}`] : [])]);
}

export type CreatureCommandInput = { sessionId: string; creatureId: string; commandId: string; action: string } & Record<string, unknown>;

export async function creatureCommand(input: CreatureCommandInput): Promise<ActionResult> {
  const sessionId = String(input.sessionId ?? "");
  const creatureId = String(input.creatureId ?? "");
  let commandId: string;
  try { commandId = requireCommandId(input.commandId); } catch (error) { return errorResult(error); }
  const action = String(input.action ?? "");
  const result = await runCommand(sessionId, commandId, async (tx) => {
    const { id, name, data: before } = await loadParticipantCreature(tx, sessionId, creatureId);
    let after: CreatureData = { ...before };
    let title = "";
    let details: string[] = [];
    let warnings: string[] = [];
    if (action === "danni") {
      const amount = positiveInt(input.amount, "Danno");
      const outcome = damageCreature(creatureHpState(before), amount);
      after = applyCreatureHpState(before, outcome.next);
      title = `Danni: ${amount}`;
      details = [...outcome.details, ...(cleanText(input.source) ? [`Fonte: ${cleanText(input.source)}`] : [])];
      warnings = outcome.warnings;
    } else if (action === "guarigione") {
      const amount = positiveInt(input.amount, "Guarigione");
      const outcome = healCreature(creatureHpState(before), amount);
      after = applyCreatureHpState(before, outcome.next);
      title = `Guarigione: ${amount}`;
      details = outcome.details;
    } else if (action === "pf-temporanei") {
      const amount = nonNegativeInt(input.amount, "PF temporanei", 10000);
      const outcome = setTemporaryHp(creatureHpState(before), amount, input.keep === true);
      after = applyCreatureHpState(before, outcome.next);
      title = "PF temporanei";
      details = outcome.details;
    } else if (action === "pf-registra") {
      const value = nonNegativeInt(input.amount, "Punti ferita");
      if (value > before.hitPointsMax) fail("I PF non possono superare il massimo.");
      after.hitPointsCurrent = value;
      title = "PF corretti";
      details = [`PF: ${before.hitPointsCurrent} → ${value}`];
    } else if (action === "condizione-aggiungi") {
      const condition = conditionInput(input);
      const result = addCondition(before.conditions ?? [], before.concentration, condition);
      after.conditions = result.conditions;
      if (result.concentration) after.concentration = result.concentration; else delete after.concentration;
      title = `Condizione: ${condition.nome}`;
      details = result.details;
    } else if (action === "condizione-rimuovi") {
      const index = nonNegativeInt(input.index, "Condizione");
      const removed = before.conditions?.[index];
      if (!removed) fail("Condizione non trovata: ricarica la pagina.");
      after.conditions = before.conditions!.filter((_, i) => i !== index);
      title = `Condizione rimossa: ${removed!.nome}`;
    } else if (action === "concentrazione-imposta") {
      const effect = cleanText(input.effect, 200);
      if (!effect) fail("Indica l'effetto su cui si concentra.");
      after.concentration = { effetto: effect, fonte: cleanText(input.source, 200), durata: cleanText(input.duration, 200) };
      title = `Concentrazione: ${effect}`;
    } else if (action === "concentrazione-termina") {
      if (!before.concentration) fail("Non risulta una concentrazione attiva.");
      delete after.concentration;
      title = `Concentrazione terminata: ${before.concentration!.effetto}`;
    } else fail("Azione non riconosciuta.");
    return { type: `creatura_${action}`, title, details, warnings, targets: [{ kind: "cr", id, name, before, after }] };
  });
  return done(result, [`/creatura/${creatureId}`]);
}

// --- PE (p. 41) --------------------------------------------------------

// --- Azioni su più bersagli -------------------------------------------

export type GroupTarget = { kind: "pg" | "cr"; id: string; half?: boolean };

// Danno ad area, cura o condizione su più bersagli in un solo comando
// annullabile. Con «half» il danno è dimezzato per difetto (TS superato, p. 28).
export async function groupCommand(input: { sessionId: string; commandId: string; mode: "danni" | "guarigione" | "condizione"; amount?: number; targets: GroupTarget[]; condition?: string; source?: string; duration?: string }): Promise<ActionResult> {
  const sessionId = String(input.sessionId ?? "");
  let commandId: string;
  try { commandId = requireCommandId(input.commandId); } catch (error) { return errorResult(error); }
  const targets = (Array.isArray(input.targets) ? input.targets : []).slice(0, 40);
  const paths = targets.map((target) => target.kind === "pg" ? `/personaggio/${target.id}` : `/creatura/${target.id}`);
  const result = await runCommand(sessionId, commandId, async (tx) => {
    if (!targets.length) fail("Scegli almeno un bersaglio.");
    const mode = input.mode;
    const amount = mode === "condizione" ? 0 : positiveInt(input.amount, mode === "danni" ? "Danno" : "Guarigione");
    const condition = mode === "condizione" ? conditionInput({ condition: input.condition, source: input.source, duration: input.duration }) : null;
    const changes: TargetChange[] = [];
    const details: string[] = [];
    const warnings: string[] = [];
    for (const target of targets) {
      const half = Boolean(target.half) && mode === "danni";
      const value = half ? Math.floor(amount / 2) : amount;
      if (target.kind === "pg") {
        const { id, name, sheet } = await loadParticipantCharacter(tx, sessionId, String(target.id));
        try {
          let after: Sheet = sheet;
          if (condition) {
            const added = addCondition(sheet.condizioni ?? [], sheet.concentrazione, condition);
            after = { ...sheet, condizioni: added.conditions };
            if (added.concentration) after.concentrazione = added.concentration; else delete after.concentrazione;
            details.push(`${name}: ${added.details.filter((line) => line !== condition.fonte && line !== condition.durata).join("; ") || condition.nome}`);
          } else if (value > 0) {
            const outcome = mode === "danni" ? damageCharacter(sheetHpState(sheet), value, false) : healCharacter(sheetHpState(sheet), value);
            after = applyHpState(sheet, outcome.next);
            details.push(`${name}${half ? " (metà)" : ""}: ${outcome.details.join("; ")}`);
            warnings.push(...outcome.warnings.map((line) => `${name}: ${line}`));
          } else details.push(`${name}: nessun danno`);
          changes.push({ kind: "pg", id, name, before: sheet, after });
        } catch (error) {
          details.push(`${name}: ${error instanceof Error ? error.message : "non applicabile"}`);
        }
      } else {
        const { id, name, data } = await loadParticipantCreature(tx, sessionId, String(target.id));
        try {
          let after: CreatureData = data;
          if (condition) {
            const added = addCondition(data.conditions ?? [], data.concentration, condition);
            after = { ...data, conditions: added.conditions };
            if (added.concentration) after.concentration = added.concentration; else delete after.concentration;
            details.push(`${name}: ${condition.nome}`);
          } else if (value > 0) {
            const outcome = mode === "danni" ? damageCreature(creatureHpState(data), value) : healCreature(creatureHpState(data), value);
            after = applyCreatureHpState(data, outcome.next);
            details.push(`${name}${half ? " (metà)" : ""}: ${outcome.details.join("; ")}`);
            warnings.push(...outcome.warnings.map((line) => `${name}: ${line}`));
          } else details.push(`${name}: nessun danno`);
          changes.push({ kind: "cr", id, name, before: data, after });
        } catch (error) {
          details.push(`${name}: ${error instanceof Error ? error.message : "non applicabile"}`);
        }
      }
    }
    if (!changes.length) fail(details.join(" ") || "Nessun bersaglio modificato.");
    const title = mode === "condizione" ? `Condizione a ${changes.length}: ${condition!.nome}` : mode === "danni" ? `Danni a ${changes.length}: ${amount}` : `Cura a ${changes.length}: ${amount}`;
    return { type: `gruppo-${mode}`, title, details: [...(input.source && mode !== "condizione" ? [`Fonte: ${cleanText(input.source)}`] : []), ...details], warnings, targets: changes };
  });
  return done(result, paths);
}

export type XpMode = "aggiungi" | "dividi" | "livello" | "imposta";

// PE assegnati dal DM (p. 370). «dividi» ripartisce un totale arrotondando per
// difetto (p. 8); «livello» porta ciascuno alla soglia del livello successivo (p. 41).
export async function awardXp(input: { sessionId: string; commandId: string; characterIds: string[]; amount?: number; mode: XpMode; reason?: string }): Promise<ActionResult & { ready?: string[] }> {
  const sessionId = String(input.sessionId ?? "");
  let commandId: string;
  try { commandId = requireCommandId(input.commandId); } catch (error) { return errorResult(error); }
  const ids = [...new Set(Array.isArray(input.characterIds) ? input.characterIds.map(String) : [])];
  const mode: XpMode = ["aggiungi", "dividi", "livello", "imposta"].includes(input.mode) ? input.mode : "aggiungi";
  const ready: string[] = [];
  const result = await runCommand(sessionId, commandId, async (tx) => {
    if (!ids.length) fail("Seleziona almeno un personaggio.");
    const amount = mode === "livello" ? 0 : mode === "imposta" ? nonNegativeInt(input.amount, "PE totali", 10000000) : positiveInt(input.amount, "PE", 10000000);
    const share = mode === "dividi" ? Math.floor(amount / ids.length) : amount;
    if (mode === "dividi" && share < 1) fail("Il totale è troppo basso per essere diviso tra i personaggi scelti.");
    const reason = cleanText(input.reason, 200);
    if (mode === "imposta" && !reason) fail("Indica il motivo della correzione dei PE.");
    const targets: TargetChange[] = [];
    const details: string[] = [];
    for (const characterId of ids) {
      const { id, name, sheet } = await loadParticipantCharacter(tx, sessionId, characterId);
      const previous = /^\d+$/.test(sheet.puntiEsperienza) ? Number(sheet.puntiEsperienza) : 0;
      const level = Number(sheet.livello);
      if (mode === "livello" && !(Number.isInteger(level) && level >= 1 && level < 20)) fail(`${name}: livello non valido o già al 20°.`);
      const total = mode === "imposta" ? amount : mode === "livello" ? Math.max(previous, xpThresholds[level]) : previous + share;
      const reached = levelForXp(total);
      if (Number.isInteger(level) && reached > level) ready.push(id);
      details.push(`${name}: ${previous} → ${total} PE${Number.isInteger(level) && reached > level ? ` · può salire al livello ${level + 1}` : ""}`);
      if (total !== previous) targets.push({ kind: "pg", id, name, before: sheet, after: { ...sheet, puntiEsperienza: String(total) } });
    }
    if (!targets.length) fail("Nessun PE da modificare: i personaggi scelti hanno già raggiunto la soglia.");
    const title = mode === "imposta" ? "PE corretti"
      : mode === "livello" ? "PE portati alla soglia del livello successivo"
      : mode === "dividi" ? `PE assegnati: ${amount} divisi tra ${ids.length} (${share} a testa)`
      : `PE assegnati: ${amount} a testa`;
    return { type: mode === "imposta" ? "pe-correggi" : "pe-assegna", title, details: [...details, ...(reason ? [`Motivo: ${reason}`] : [])], targets };
  });
  return { ...done(result, ids.map((id) => `/personaggio/${id}`)), ...(result.ok ? { ready } : {}) };
}

// --- Riposi (pp. 27, 371) ---------------------------------------------

function previousLongRest(sheet: Sheet): number | null {
  const story = sheet.eventiStoria ?? [];
  for (let index = story.length - 1; index >= 0; index -= 1) {
    const event = story[index];
    if (event.titolo !== "Riposo lungo completato") continue;
    const undone = story.slice(index + 1).some((later) => later.titolo === "Azione annullata" && later.dettagli[0] === "Riposo lungo completato");
    if (undone) continue;
    const timestamp = Date.parse(event.data);
    return Number.isNaN(timestamp) ? null : timestamp;
  }
  return null;
}

export type RestInput = {
  sessionId: string; commandId: string; kind: "breve" | "lungo";
  characters: { id: string; rolls?: number[]; spentBefore?: number; inspirationTarget?: string }[];
  creatureIds: string[];
};

export async function groupRest(input: RestInput): Promise<ActionResult> {
  const sessionId = String(input.sessionId ?? "");
  let commandId: string;
  try { commandId = requireCommandId(input.commandId); } catch (error) { return errorResult(error); }
  const kind = input.kind === "lungo" ? "lungo" : "breve";
  const entries = Array.isArray(input.characters) ? input.characters : [];
  const creatureIds = [...new Set(Array.isArray(input.creatureIds) ? input.creatureIds.map(String) : [])];
  const result = await runCommand(sessionId, commandId, async (tx, _session, now) => {
    if (!entries.length && !creatureIds.length) fail("Seleziona almeno un partecipante al riposo.");
    const prepared: { id: string; name: string; before: Sheet; after: Sheet }[] = [];
    const transfers: { targetId: string; sourceName: string }[] = [];
    const details: string[] = [];
    for (const entry of entries) {
      const { id, name, sheet: before } = await loadParticipantCharacter(tx, sessionId, String(entry.id));
      const currentHp = Number(before.puntiFerita);
      const maxHp = Number(before.puntiFeritaMax);
      if (!Number.isInteger(currentHp) || currentHp < 1) fail(`${name}: serve almeno 1 PF per iniziare un riposo (p. 371).`);
      if (!Number.isInteger(maxHp) || maxHp < currentHp) fail(`${name}: PF massimi mancanti o non validi.`);
      if (kind === "lungo") {
        const last = previousLongRest(before);
        if (last !== null && now.getTime() - last < 16 * 60 * 60 * 1000) fail(`${name}: devono passare 16 ore dall'ultimo riposo lungo registrato (p. 371).`);
      }
      const after: Sheet = { ...before };
      const notes: string[] = [];
      if (kind === "breve") {
        const rolls = (Array.isArray(entry.rolls) ? entry.rolls : []).map(Number);
        if (rolls.length) {
          const die = hitDieSize(before);
          const total = hitDiceTotal(before);
          if (!die || !total) fail(`${name}: Dadi Vita non registrati o non validi.`);
          let spent = Number(before.dadiVitaSpesi);
          if (!Number.isInteger(spent) || spent < 0) {
            spent = Number(entry.spentBefore);
            if (!Number.isInteger(spent) || spent < 0) fail(`${name}: indica quanti Dadi Vita erano già spesi.`);
          }
          if (rolls.some((roll) => !Number.isInteger(roll) || roll < 1 || roll > die!)) fail(`${name}: ogni risultato deve essere tra 1 e ${die}.`);
          if (rolls.length > total! - spent) fail(`${name}: Dadi Vita disponibili insufficienti (${total! - spent}).`);
          const con = Number(abilityModifier(before.caratteristiche.find((ability) => ability.abbr === "COS")?.valore ?? "") || 0);
          const recovery = rolls.reduce((sum, roll) => sum + Math.max(1, roll + con), 0);
          after.puntiFerita = String(Math.min(maxHp, currentHp + recovery));
          after.dadiVitaSpesi = String(spent + rolls.length);
          notes.push(`Dadi Vita ${rolls.join(", ")} (COS ${con >= 0 ? "+" : ""}${con}): +${Number(after.puntiFerita) - currentHp} PF`);
        }
      } else {
        after.puntiFerita = String(maxHp);
        after.puntiFeritaTemporanei = "0";
        after.dadiVitaSpesi = "0";
        if ((before.indebolimento ?? 0) > 0) {
          after.indebolimento = before.indebolimento! - 1;
          notes.push(`Indebolimento ${before.indebolimento} → ${after.indebolimento}`);
        }
        if (currentHp !== maxHp) notes.push(`PF ${currentHp} → ${maxHp}`);
        if (before.specie === "Umano") {
          if (!before.ispirazioneEroica) {
            after.ispirazioneEroica = true;
            notes.push("Ispirazione eroica (Intraprendente, p. 197)");
          } else if (entry.inspirationTarget && entry.inspirationTarget !== id) {
            transfers.push({ targetId: String(entry.inspirationTarget), sourceName: name });
            notes.push("Ispirazione di Intraprendente trasferita (p. 13)");
          }
        }
      }
      after.risorse = rechargeResources(after.risorse ?? [], kind);
      after.slotSpesi = rechargeSpellSlots(after, kind);
      const recovered = (before.risorse ?? []).flatMap((resource, index) => (after.risorse?.[index]?.spesi ?? resource.spesi) < resource.spesi ? [resource.nome] : []);
      if (recovered.length) notes.push(`Risorse: ${recovered.join(", ")}`);
      if (Object.entries(before.slotSpesi ?? {}).some(([level, spent]) => (after.slotSpesi?.[level] ?? 0) < spent)) notes.push("Slot incantesimo recuperati");
      details.push(`${name}: ${notes.length ? notes.join("; ") : "nessun recupero"}`);
      prepared.push({ id, name, before, after });
    }
    for (const transfer of transfers) {
      const target = prepared.find((item) => item.id === transfer.targetId);
      if (!target) fail("Chi riceve l'Ispirazione deve partecipare al riposo.");
      if (target!.after.ispirazioneEroica) fail(`${target!.name} possiede già Ispirazione eroica.`);
      target!.after.ispirazioneEroica = true;
      details.push(`${target!.name}: riceve Ispirazione eroica da ${transfer.sourceName}`);
    }
    const targets: TargetChange[] = prepared.map((item) => ({ kind: "pg", ...item }));
    for (const creatureId of creatureIds) {
      const { id, name, data } = await loadParticipantCreature(tx, sessionId, creatureId);
      if (data.hitPointsCurrent < 1) fail(`${name}: serve almeno 1 PF per riposare (p. 371).`);
      const after = kind === "lungo" ? { ...data, hitPointsCurrent: data.hitPointsMax, hitPointsTemp: 0 } : data;
      details.push(`${name}: ${kind === "lungo" && data.hitPointsCurrent !== data.hitPointsMax ? `PF ${data.hitPointsCurrent} → ${data.hitPointsMax}` : "nessun recupero"}`);
      targets.push({ kind: "cr", id, name, before: data, after });
    }
    return { type: `riposo_${kind}_gruppo`, title: kind === "breve" ? "Riposo breve completato" : "Riposo lungo completato", details, targets };
  });
  return done(result, ["/", ...entries.map((entry) => `/personaggio/${entry.id}`)]);
}

// --- Annullamento ------------------------------------------------------

export async function undoEvent(input: { sessionId: string; eventId: string; commandId: string }): Promise<ActionResult> {
  const sessionId = String(input.sessionId ?? "");
  const eventId = String(input.eventId ?? "");
  let commandId: string;
  try { commandId = requireCommandId(input.commandId); } catch (error) { return errorResult(error); }
  const touched: string[] = [];
  try {
    const now = new Date();
    const result = await db.transaction(async (tx): Promise<ActionResult> => {
      const [duplicate] = await tx.select({ id: masterSessionEvents.id }).from(masterSessionEvents).where(eq(masterSessionEvents.id, commandId)).limit(1);
      if (duplicate) return { ok: true };
      const session = await requireOpenSession(tx, sessionId);
      const [event] = await tx.select().from(masterSessionEvents).where(and(eq(masterSessionEvents.id, eventId), eq(masterSessionEvents.sessionId, sessionId))).limit(1);
      if (!event) fail("Evento non trovato.");
      const payload = event!.payload as { title?: string; undo?: { targets: UndoTarget[] } };
      if (!payload.undo?.targets?.length) fail("Questa azione non si può annullare.");
      const reverts = await tx.select({ payload: masterSessionEvents.payload }).from(masterSessionEvents)
        .where(and(eq(masterSessionEvents.sessionId, sessionId), eq(masterSessionEvents.type, "annullamento")));
      if (reverts.some((row) => (row.payload as { revertsEventId?: string }).revertsEventId === eventId)) fail("Azione già annullata.");
      const title = payload.title ?? event!.type;
      const names: string[] = [];
      for (const target of payload.undo!.targets) {
        if (target.kind === "pg") {
          const [row] = await tx.select().from(characters).where(eq(characters.id, target.id)).limit(1);
          if (!row) fail("Personaggio non più presente.");
          const current = normalizeSheet(row!.data);
          if (stableJson(sheetPatch(current)) !== stableJson(target.after)) fail(`${row!.name} è cambiato dopo questa azione: annulla prima le azioni più recenti.`);
          await storeCharacter(tx, target.id, current, applySheetPatch(current, target.before), now, storyEvent(session.name, "Azione annullata", [title], now));
          names.push(row!.name);
          touched.push(`/personaggio/${target.id}`);
        } else {
          const [row] = await tx.select().from(creatures).where(eq(creatures.id, target.id)).limit(1);
          if (!row) fail("Creatura non più presente.");
          if (stableJson({ name: row!.name, data: normalizeCreature(row!.data) }) !== stableJson({ name: target.after.name, data: normalizeCreature(target.after.data) })) {
            fail(`${row!.name} è cambiata dopo questa azione: annulla prima le azioni più recenti.`);
          }
          await tx.update(creatures).set({ name: target.before.name, data: normalizeCreature(target.before.data), updatedAt: now }).where(eq(creatures.id, target.id));
          names.push(target.before.name);
          touched.push(`/creatura/${target.id}`);
        }
      }
      await tx.insert(masterSessionEvents).values({
        id: commandId, sessionId, type: "annullamento", occurredAt: now,
        characterId: event!.characterId, creatureId: event!.creatureId,
        payload: { title: `Annullato: ${title}`, revertsEventId: eventId, details: [`Ripristinato: ${names.join(", ")}`] },
      });
      return { ok: true, title: `Annullato: ${title}` };
    });
    return done(result, touched);
  } catch (error) {
    return errorResult(error);
  }
}
