import assert from "node:assert/strict";
import { test } from "node:test";
import { applyLevelUp, levelUpErrors, planLevelUp } from "../lib/levelUp.ts";
import { readyToLevel } from "../lib/masterRules.ts";
import { emptySheet } from "../lib/sheet.ts";
import { subclassSpellGrants } from "../lib/subclassSpells.ts";

function character(classe, level, patch = {}) {
  const sheet = emptySheet();
  sheet.classe = classe;
  sheet.livello = String(level);
  sheet.puntiFeritaMax = "20";
  sheet.puntiFerita = "12";
  sheet.dadiVita = `${level}d${{ Barbaro: 12, Guerriero: 10, Paladino: 10, Ranger: 10, Mago: 6, Stregone: 6 }[classe] ?? 8}`;
  sheet.caratteristiche = sheet.caratteristiche.map((item) => ({ ...item, valore: item.abbr === "COS" ? "14" : "13" }));
  return Object.assign(sheet, patch);
}

test("PF al livello: valore fisso o tiro + Costituzione, minimo 1 (p. 42)", () => {
  const sheet = character("Guerriero", 1);
  const plan = planLevelUp("x", "Prova", sheet);
  assert.equal(plan.fixedGain, 6);
  const fixed = applyLevelUp(sheet, plan, { hp: { method: "fisso" } });
  assert.equal(fixed.sheet.puntiFeritaMax, "28");
  assert.equal(fixed.sheet.puntiFerita, "12", "il cambio di livello non cura");
  assert.equal(fixed.sheet.dadiVita, "2d10");
  const low = character("Mago", 1);
  low.caratteristiche = low.caratteristiche.map((item) => item.abbr === "COS" ? { ...item, valore: "6" } : item);
  const lowPlan = planLevelUp("x", "Prova", low);
  assert.equal(applyLevelUp(low, lowPlan, { hp: { method: "tiro", roll: 1 } }).sheet.puntiFeritaMax, "21");
  assert.deepEqual(levelUpErrors(sheet, plan, { hp: { method: "tiro", roll: 11 } }).length, 1);
});

test("Robustezza nanica e Robusto aggiungono PF a ogni livello (pp. 190, 202)", () => {
  const dwarf = character("Guerriero", 2, { specie: "Nano", talenti: [{ nome: "Robusto", scelte: "" }] });
  const plan = planLevelUp("x", "Prova", dwarf);
  assert.deepEqual(plan.hpBonus.map((item) => item.value), [1, 2]);
  assert.equal(applyLevelUp(dwarf, plan, { hp: { method: "fisso" }, subclass: "Campione" }).sheet.puntiFeritaMax, String(20 + 6 + 2 + 3));
});

test("al 3° livello si sceglie la sottoclasse e si ottengono i suoi privilegi", () => {
  const sheet = character("Chierico", 2);
  const plan = planLevelUp("x", "Prova", sheet);
  assert.equal(plan.subclass.required, true);
  assert.equal(plan.subclass.options.length, 4);
  assert.ok(levelUpErrors(sheet, plan, { hp: { method: "fisso" } }).some((error) => /sottoclasse/i.test(error)));
  assert.deepEqual(plan.spells.alwaysPrepared["Dominio della Vita"], ["Aiuto", "Benedizione", "Cura ferite", "Ristorare inferiore"]);
});

test("Aumento dei punteggi: +2 o +1/+1, massimo 20; aumento di Costituzione retroattivo (pp. 42, 203)", () => {
  const sheet = character("Guerriero", 3, { sottoclasse: "Campione" });
  sheet.caratteristiche = sheet.caratteristiche.map((item) => item.abbr === "COS" ? { ...item, valore: "15" } : item);
  const plan = planLevelUp("x", "Prova", sheet);
  assert.equal(plan.feat.reason, "asi");
  assert.equal(plan.feat.options[0].name, "Aumento dei punteggi di caratteristica");
  const bad = levelUpErrors(sheet, plan, { hp: { method: "fisso" }, feat: { name: "Aumento dei punteggi di caratteristica", increases: { FOR: 1 } }, masteries: [] });
  assert.ok(bad.some((error) => /\+2/.test(error)));
  const result = applyLevelUp(sheet, plan, { hp: { method: "fisso" }, feat: { name: "Aumento dei punteggi di caratteristica", increases: { COS: 1, FOR: 1 } } });
  // 6 + COS +2 (prima dell'aumento) = 8, poi +1 per ciascuno dei 4 livelli.
  assert.equal(result.sheet.puntiFeritaMax, String(20 + 8 + 4));
  assert.equal(result.sheet.caratteristiche.find((item) => item.abbr === "COS").valore, "16");
});

test("Resiliente concede la competenza nel tiro salvezza scelto", () => {
  const sheet = character("Bardo", 3, { sottoclasse: "Collegio della Sapienza" });
  const plan = planLevelUp("x", "Prova", sheet);
  const option = plan.feat.options.find((item) => item.name === "Resiliente");
  assert.equal(option.increase.kind, "resiliente");
  const result = applyLevelUp(sheet, plan, { hp: { method: "fisso" }, feat: { name: "Resiliente", increases: { SAG: 1 } } });
  assert.equal(result.sheet.caratteristiche.find((item) => item.abbr === "SAG").tsCompetente, true);
  assert.ok(result.sheet.fontiCompetenze.some((item) => item.tipo === "tiroSalvezza" && item.valore === "SAG"));
});

test("incantesimi: la lista preparata cresce fino al valore della tabella (p. 59)", () => {
  const sheet = character("Bardo", 1, { incantesimi: [
    { nome: "Beffa crudele", fonte: "classe", stato: "conosciuto" }, { nome: "Luci danzanti", fonte: "classe", stato: "conosciuto" },
    ...["Charme su persone", "Parola guaritrice", "Spruzzo colorato", "Sussurri dissonanti"].map((nome) => ({ nome, fonte: "classe", stato: "preparato" })),
  ] });
  const plan = planLevelUp("x", "Prova", sheet);
  assert.equal(plan.spells.cantrips.needed, 0);
  assert.equal(plan.spells.prepared.needed, 1);
  assert.equal(plan.spells.prepared.canReplace, true);
  assert.equal(plan.expertise.count, 2);
});

test("mago: due incantesimi nel libro a ogni livello (p. 112)", () => {
  const sheet = character("Mago", 1);
  const plan = planLevelUp("x", "Prova", sheet);
  assert.equal(plan.spells.book.needed, 2);
  const [first, second] = plan.spells.book.options;
  const choices = { hp: { method: "fisso" }, cantrips: plan.spells.cantrips.options.slice(0, plan.spells.cantrips.needed).map((item) => item.name), book: [first.name, second.name], prepared: [first.name, second.name], expertise: [] };
  const result = applyLevelUp(sheet, plan, choices);
  assert.ok(result.sheet.incantesimi.some((spell) => spell.nome === first.name && spell.stato === "preparato"));
});

test("warlock all'11°: Arcanum mistico di 6° livello", () => {
  const plan = planLevelUp("x", "Prova", character("Warlock", 10, { sottoclasse: "Patrono Immondo" }));
  assert.equal(plan.spells.arcanum.level, 6);
  assert.ok(plan.spells.arcanum.options.length > 0);
});

test("ranger al 2°: Esploratore esperto (lingue e maestria) e stile o Guerriero Druidico", () => {
  const sheet = character("Ranger", 1);
  sheet.abilita = sheet.abilita.map((item) => ["SOPRAVVIVENZA", "PERCEZIONE"].includes(item.nome) ? { ...item, competente: true } : item);
  const plan = planLevelUp("x", "Prova", sheet);
  assert.equal(plan.languages.count, 2);
  assert.equal(plan.expertise.count, 1);
  assert.equal(plan.feat.reason, "stile");
  assert.equal(plan.feat.alternative.name, "Guerriero Druidico");
  const result = applyLevelUp(sheet, plan, { hp: { method: "fisso" }, languages: ["Elfico", "Silvano"], expertise: ["PERCEZIONE"], feat: { alternative: true, cantrips: plan.feat.alternative.options.slice(0, 2).map((item) => item.name) }, prepared: [] });
  assert.ok(result.sheet.lingue.includes("Silvano"));
  assert.equal(result.sheet.abilita.find((item) => item.nome === "PERCEZIONE").maestria, true);
  assert.equal(result.sheet.incantesimi.filter((spell) => spell.fonte === "privilegio").length, 2);
});

test("PE e soglie: pronto a salire solo con i PE della tabella (p. 41)", () => {
  assert.equal(readyToLevel("2", "899"), false);
  assert.equal(readyToLevel("2", "900"), true);
  assert.equal(readyToLevel("20", "999999"), false);
});

test("tabelle degli incantesimi di sottoclasse con alias «Evoca» → «Richiama»", () => {
  assert.deepEqual(subclassSpellGrants("Stregone", "Stregoneria Draconica", 9), ["Conoscenza delle leggende", "Richiama drago"]);
  assert.deepEqual(subclassSpellGrants("Paladino", "Giuramento di Vendetta", 13), ["Esilio", "Porta dimensionale"]);
  assert.deepEqual(subclassSpellGrants("Chierico", "Dominio della Vita", 4), []);
});

test("nessun cambio di livello oltre il 20°", () => {
  assert.ok("error" in planLevelUp("x", "Prova", character("Guerriero", 20)));
});
