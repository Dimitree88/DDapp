// Confronto fra i prerequisiti stampati dei talenti e la logica dell'app
// (lib/featPrerequisites.ts e lib/featCatalog.ts), usato dai test T01-T04.
import { featByName } from "../../lib/featCatalog";
import { featPrerequisitesMet } from "../../lib/featPrerequisites";
import { emptySheet, type Sheet } from "../../lib/sheet";
import type { VoceTalento } from "../../lib/manuale-2024/schema";

const SIGLE: Record<string, string> = { Forza: "FOR", Destrezza: "DES", Costituzione: "COS", Intelligenza: "INT", Saggezza: "SAG", Carisma: "CAR" };

function scheda(modifica: (sheet: Sheet) => void): Sheet {
  const sheet = { ...emptySheet(), classe: "Guerriero", livello: "20" };
  sheet.caratteristiche = sheet.caratteristiche.map((item) => ({ ...item, valore: "12" }));
  sheet.competenzeArmatura = { leggere: true, medie: true, pesanti: true, scudi: true };
  modifica(sheet);
  return sheet;
}

// Restituisce le differenze trovate (vuoto se coerente).
export function differenzePrerequisiti(voce: VoceTalento): string[] {
  const differenze: string[] = [];
  const prerequisito = voce.prerequisito ?? "";
  const livello = /(\d+)° livello o superiore/.exec(prerequisito);
  const minimo = featByName(voce.nome)?.minLevel;
  if ((livello ? Number(livello[1]) : 1) !== minimo) differenze.push(`livello minimo ${minimo} invece di ${livello?.[1] ?? 1}`);

  const caratteristiche = /((?:Forza|Destrezza|Costituzione|Intelligenza|Saggezza|Carisma)(?:(?:, | o )(?:Forza|Destrezza|Costituzione|Intelligenza|Saggezza|Carisma))*) 13 o superiore/.exec(prerequisito);
  if (caratteristiche) {
    const sigle = caratteristiche[1].split(/, | o /).map((nome) => SIGLE[nome]);
    if (featPrerequisitesMet(scheda(() => undefined), voce.nome)) differenze.push("accettato senza punteggio 13");
    for (const sigla of sigle) {
      const ok = scheda((sheet) => { sheet.caratteristiche = sheet.caratteristiche.map((item) => item.abbr === sigla ? { ...item, valore: "13" } : item); });
      if (!featPrerequisitesMet(ok, voce.nome)) differenze.push(`rifiutato con ${sigla} 13`);
    }
  }
  if (/privilegio Incantesimi/.test(prerequisito)) {
    if (featPrerequisitesMet(scheda((sheet) => { sheet.classe = "Barbaro"; }), voce.nome)) differenze.push("accettato senza Incantesimi");
    if (!featPrerequisitesMet(scheda((sheet) => { sheet.classe = "Mago"; }), voce.nome)) differenze.push("rifiutato con Incantesimi");
    const patto = featPrerequisitesMet(scheda((sheet) => { sheet.classe = "Warlock"; }), voce.nome);
    if (patto !== /Magia del patto/.test(prerequisito)) differenze.push(`Magia del patto ${patto ? "accettata" : "rifiutata"}`);
  }
  const armatura = /Competenza nelle armature (leggere|medie|pesanti)|Competenza negli scudi/.exec(prerequisito);
  if (armatura) {
    const chiave = armatura[1] === "leggere" ? "leggere" : armatura[1] === "medie" ? "medie" : armatura[1] === "pesanti" ? "pesanti" : "scudi";
    if (featPrerequisitesMet(scheda((sheet) => { sheet.competenzeArmatura[chiave] = false; }), voce.nome)) differenze.push(`accettato senza competenza ${chiave}`);
  }
  return differenze;
}
