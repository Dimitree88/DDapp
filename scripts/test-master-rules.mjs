import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addCondition, concentrationDc, damageCharacter, damageCreature, deathSave, healCharacter, healCreature,
  levelForXp, rollFormula, setTemporaryHp, stabilize, xpProgress,
} from "../lib/masterRules.ts";
import { averageDamage, creatureActionSummary, normalizeCreature } from "../lib/creature.ts";
import { describeEvents } from "../lib/masterEvents.ts";

const hp = (patch = {}) => ({ current: 6, max: 12, temp: 0, saves: { successi: 0, fallimenti: 0 }, death: undefined, conditions: [], concentration: undefined, ...patch });

test("i PF temporanei assorbono il danno per primi (p. 29)", () => {
  const { next } = damageCharacter(hp({ temp: 5 }), 7, false);
  assert.equal(next.temp, 0);
  assert.equal(next.current, 4);
});

test("danni considerevoli: morte istantanea se il danno residuo è almeno pari ai PF massimi (p. 28)", () => {
  assert.equal(damageCharacter(hp(), 18, false).next.death, "morto");
  const down = damageCharacter(hp(), 17, false).next;
  assert.equal(down.current, 0);
  assert.equal(down.death, "tiri");
  assert.ok(down.conditions.some((item) => item.nome === "Privo di sensi"));
});

test("danni a 0 PF: un fallimento, due se critico, stabile torna ai tiri (p. 29)", () => {
  const zero = hp({ current: 0, death: "stabile", saves: { successi: 0, fallimenti: 0 } });
  assert.equal(damageCharacter(zero, 3, false).next.saves.fallimenti, 1);
  const critical = damageCharacter(zero, 3, true).next;
  assert.equal(critical.saves.fallimenti, 2);
  assert.equal(critical.death, "tiri");
  assert.equal(damageCharacter(zero, 12, false).next.death, "morto");
});

test("concentrazione: CD 10 o metà danni fino a 30; termina a 0 PF (p. 364)", () => {
  assert.equal(concentrationDc(7), 10);
  assert.equal(concentrationDc(25), 12);
  assert.equal(concentrationDc(90), 30);
  const focused = hp({ current: 10, concentration: { effetto: "Benedizione", fonte: "", durata: "" } });
  assert.match(damageCharacter(focused, 4, false).warnings[0], /CD 10/);
  assert.equal(damageCharacter(focused, 10, false).next.concentration, undefined);
  assert.equal(addCondition([], focused.concentration, { nome: "Stordito", fonte: "", durata: "", nota: "" }).concentration, undefined);
  assert.ok(addCondition([], focused.concentration, { nome: "Prono", fonte: "", durata: "", nota: "" }).concentration);
});

test("tiri salvezza contro morte: 1 vale due fallimenti, 20 recupera 1 PF, tre successi stabile (p. 29)", () => {
  const zero = hp({ current: 0, death: "tiri", conditions: [{ nome: "Privo di sensi", fonte: "Punti ferita a 0", durata: "", nota: "" }] });
  assert.equal(deathSave(zero, "uno").next.saves.fallimenti, 2);
  const revived = deathSave(zero, "venti").next;
  assert.equal(revived.current, 1);
  assert.equal(revived.conditions.length, 0);
  const almost = { ...zero, saves: { successi: 2, fallimenti: 1 } };
  assert.equal(deathSave(almost, "successo").next.death, "stabile");
  assert.equal(deathSave({ ...zero, saves: { successi: 0, fallimenti: 2 } }, "fallimento").next.death, "morto");
  assert.equal(stabilize(zero).next.death, "stabile");
});

test("guarigione fino al massimo; a 0 PF riprende conoscenza; rifiutata a PF pieni (p. 28)", () => {
  assert.equal(healCharacter(hp(), 20).next.current, 12);
  const zero = hp({ current: 0, death: "tiri", saves: { successi: 1, fallimenti: 2 } });
  const healed = healCharacter(zero, 3).next;
  assert.equal(healed.death, undefined);
  assert.deepEqual(healed.saves, { successi: 0, fallimenti: 0 });
  assert.throws(() => healCharacter(hp({ current: 12 }), 1));
  assert.throws(() => healCreature(hp({ current: 12 }), 1));
});

test("PF temporanei: non si sommano (p. 29)", () => {
  assert.equal(setTemporaryHp(hp({ temp: 10 }), 12, false).next.temp, 12);
  assert.equal(setTemporaryHp(hp({ temp: 10 }), 12, true).next.temp, 10);
});

test("mostri: PF a 0 senza tiri contro morte (p. 28)", () => {
  const { next, details } = damageCreature(hp({ temp: 2 }), 10);
  assert.equal(next.current, 0);
  assert.equal(next.temp, 0);
  assert.ok(details.some((line) => /muore/.test(line)));
});

test("avanzamento: soglie di PE della tabella di p. 41", () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(299), 1);
  assert.equal(levelForXp(300), 2);
  assert.equal(levelForXp(355000), 20);
  assert.deepEqual(xpProgress("900", "2")?.ready, true);
  assert.equal(xpProgress("", "2"), null);
});

test("colpo critico: i dadi di danno si tirano due volte (p. 27)", () => {
  assert.equal(rollFormula("2d6 + 3").rolls.length, 2);
  const critical = rollFormula("2d6 + 3", true);
  assert.equal(critical.rolls.length, 4);
  assert.equal(critical.modifier, 3);
  assert.ok(critical.total >= 7 && critical.total <= 27);
  assert.equal(rollFormula("tre dadi"), null);
});

test("media dei danni arrotondata per difetto (p. 8)", () => {
  assert.equal(averageDamage("1d6 + 3"), 6);
  assert.equal(averageDamage("2d10 + 6"), 17);
  assert.equal(averageDamage("x"), null);
});

test("le creature salvate prima dell'editor restano leggibili", () => {
  const legacy = {
    origin: "personalizzata", description: "Cucciolo", creatureType: "Mostruosità", size: "Piccola", armorClass: 12, armorClassNote: "Pelliccia",
    hitPointsMax: 9, hitPointsCurrent: 9, speedMeters: 9, challengeRating: "0", experiencePoints: 10,
    actions: [{ name: "Beccata", attackType: "Tiro per colpire in mischia", hitBonus: 3, reachMeters: null, hitDamage: 3, damageFormula: "1d4 + 1", damageType: "perforanti" }],
    traits: [{ name: "Plot Armor", description: "Non muore.", adjudication: "master" }],
  };
  const data = normalizeCreature(legacy);
  assert.equal(data.abilities.length, 6);
  assert.equal(data.actions[0].category, "azione");
  assert.equal(data.hitPointsCurrent, 9);
  assert.equal(creatureActionSummary(data.actions[0]), "Tiro per colpire in mischia: +3. Colpito: 3 (1d4 + 1) danni perforanti.");
});

test("il registro descrive eventi vecchi e annullamenti", () => {
  const rows = [
    { id: "a", type: "danni", occurredAt: new Date(0), characterId: "pg", creatureId: null, payload: { title: "Danni: 3", details: ["PF: 6 → 3"], undo: { targets: [{ kind: "pg", id: "pg" }] } } },
    { id: "b", type: "annullamento", occurredAt: new Date(1), characterId: "pg", creatureId: null, payload: { title: "Annullato: Danni: 3", revertsEventId: "a" } },
    { id: "c", type: "creatura_danni", occurredAt: new Date(2), characterId: null, creatureId: "cr", payload: { before: { hitPointsCurrent: 6 }, after: { hitPointsCurrent: 2 } } },
  ];
  const [damage, undo, legacy] = describeEvents(rows, new Map([["pg", "Aria"], ["cr", "Lupo"]]));
  assert.equal(damage.subject, "Aria");
  assert.equal(damage.undone, true);
  assert.equal(undo.undoable, false);
  assert.equal(legacy.title, "Danni alla creatura");
  assert.deepEqual(legacy.lines, ["PF: 6 → 2"]);
});
