// Confronto fra il file della classe in lib/manuale-2024/classi/ (trascritto dal PDF)
// e i dati che l'app usa per la stessa classe: tratti, progressione e privilegi.
import privilegiClassi from "../../lib/class-feature-grants.json";
import privilegiSottoclassi from "../../lib/subclass-feature-grants.json";
import regole from "../../lib/manuale-2024-domains.json";
import { proficiencyBonus } from "../../lib/abilityBonus";
import { classHitDice } from "../../lib/classProgression";
import { classSavingThrows, classToolProficiencies, classWeaponProficiencies, grantClassProficiencies } from "../../lib/classSavingThrows";
import { classSkillChoices } from "../../lib/classSkillChoices";
import { emptySheet } from "../../lib/sheet";
import { spellSlots } from "../../lib/spellcasting";
import { pendingToolChoiceSources } from "../../lib/toolCompetencies";
import { chiaveRicerca, manuale } from "../../lib/manuale-2024/index";
import type { Privilegio, VoceClasse, VoceSottoclasse } from "../../lib/manuale-2024/schema";

type Concessione = { level: number; name: string; page: number };

const fileDi = (classe: string) => `classi/${classe.toLowerCase()}`;
const uguali = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const ARMATURE: Record<string, string> = { Leggere: "leggere", Medie: "medie", Pesanti: "pesanti", Scudi: "scudi" };

export function voceClasse(classe: string): VoceClasse {
  const voce = manuale.voci(fileDi(classe)).find((item) => item.tipo === "classe");
  if (!voce || voce.tipo !== "classe") throw new Error(`Classe ${classe} assente`);
  return voce;
}

export function sottoclassiDi(classe: string): VoceSottoclasse[] {
  return manuale.voci(fileDi(classe)).filter((item): item is VoceSottoclasse => item.tipo === "sottoclasse");
}

const confrontaPrivilegi = (padre: string, privilegi: Privilegio[], concessioni: Concessione[]) =>
  JSON.stringify(privilegi.map((item) => [item.livello, item.nome, item.pagina])) === JSON.stringify(concessioni.map((item) => [item.level, item.name, item.page]))
    ? [] : [`${padre}: privilegi diversi da class/subclass-feature-grants`];

// Tratti della classe confrontati con i dati dell'app.
export function differenzeTratti(classe: string): string[] {
  const voce = voceClasse(classe);
  const differenze: string[] = [];
  if (voce.dadoVita !== `D${classHitDice[classe]}`) differenze.push(`Dado Vita ${voce.dadoVita} ≠ d${classHitDice[classe]}`);
  if (!uguali(voce.tiriSalvezza, classSavingThrows[classe] ?? [])) differenze.push(`tiri salvezza ${voce.tiriSalvezza} ≠ ${classSavingThrows[classe]}`);
  const abilita = classSkillChoices[classe];
  if (voce.competenze.abilita.numero !== abilita?.count) differenze.push(`numero abilità ${voce.competenze.abilita.numero} ≠ ${abilita?.count}`);
  if (!uguali(voce.competenze.abilita.scelte.map((nome) => nome.toUpperCase()), abilita?.names ?? [])) differenze.push("abilità di classe diverse");
  if (abilita && !(voce.tabelle ?? []).some((tabella) => tabella.pagina === abilita.page && tabella.titolo.startsWith("Tratti"))) differenze.push(`pagina abilità ${abilita.page}`);
  if (!uguali(voce.competenze.armi, classWeaponProficiencies(classe))) differenze.push(`armi ${voce.competenze.armi} ≠ ${classWeaponProficiencies(classe)}`);
  if (!uguali(voce.competenze.strumenti, classToolProficiencies(classe))) differenze.push(`strumenti ${voce.competenze.strumenti} ≠ ${classToolProficiencies(classe)}`);
  const scelte = pendingToolChoiceSources({ ...emptySheet(), classe }).find((item) => item.source === `Classe: ${classe}`)?.remaining ?? 0;
  if ((voce.competenze.strumentiAScelta?.numero ?? 0) !== scelte) differenze.push(`strumenti a scelta ${voce.competenze.strumentiAScelta?.numero ?? 0} ≠ ${scelte}`);
  const armature = Object.entries(grantClassProficiencies({ ...emptySheet(), classe }).competenzeArmatura).filter(([, nota]) => nota).map(([tipo]) => tipo);
  if (!uguali(voce.competenze.armature.map((nome) => ARMATURE[nome] ?? nome), armature)) differenze.push(`armature ${voce.competenze.armature} ≠ ${armature}`);
  if (!uguali(sottoclassiDi(classe).map((item) => item.nome), (regole.classi as Record<string, string[]>)[classe] ?? [])) differenze.push("sottoclassi diverse dal dominio");
  return differenze;
}

// Tabella di progressione: bonus di competenza e privilegi per livello.
export function differenzeProgressione(classe: string): string[] {
  const voce = voceClasse(classe);
  const tabella = (voce.tabelle ?? []).find((item) => item.colonne[0] === "Livello" && item.righe.length === 20);
  if (!tabella) return ["tabella di progressione assente"];
  const differenze: string[] = [];
  const colonnaPrivilegi = tabella.colonne.indexOf("Privilegi di classe");
  const livelliSottoclasse = new Set(sottoclassiDi(classe).flatMap((item) => item.privilegi.map((privilegio) => privilegio.livello)));
  const concessioni = (privilegiClassi as Record<string, Concessione[]>)[classe] ?? [];
  const giaVisti = new Set<string>();
  tabella.righe.forEach((riga, indice) => {
    const livello = indice + 1;
    if (riga[0] !== String(livello)) differenze.push(`riga ${livello}: livello ${riga[0]}`);
    if (riga[1] !== proficiencyBonus(String(livello))) differenze.push(`livello ${livello}: bonus ${riga[1]} ≠ ${proficiencyBonus(String(livello))}`);
    const nomi = riga[colonnaPrivilegi] === "—" ? [] : riga[colonnaPrivilegi].split(/, (?=[A-ZÀ-Üa-zà-ü])/).map(chiaveRicerca);
    const attesi = concessioni.filter((item) => item.level === livello).map((item) => chiaveRicerca(item.name));
    for (const nome of nomi) {
      if (nome === chiaveRicerca("Privilegio della sottoclasse")) {
        if (!livelliSottoclasse.has(livello)) differenze.push(`livello ${livello}: nessun privilegio di sottoclasse`);
      } else if (!attesi.includes(nome) && !giaVisti.has(nome)) differenze.push(`livello ${livello}: «${nome}» assente nei privilegi`);
    }
    for (const atteso of attesi) if (!nomi.includes(atteso)) differenze.push(`livello ${livello}: «${atteso}» assente nella tabella`);
    nomi.forEach((nome) => giaVisti.add(nome));
    // Slot incantesimo per livello (colonne «1»…«9»), confrontati con spellcasting.ts#spellSlots.
    const colonneSlot = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((nome) => tabella.colonne.indexOf(nome));
    if (colonneSlot.every((colonna) => colonna >= 0)) {
      const stampati = colonneSlot.map((colonna) => riga[colonna] === "—" ? 0 : Number(riga[colonna]));
      const app = spellSlots({ ...emptySheet(), classe, livello: String(livello) }).map((slot) => slot.maximum);
      const pieni = (valori: number[]) => valori.join(",").replace(/(,0)+$/, "");
      if (pieni(stampati) !== pieni(app)) differenze.push(`livello ${livello}: slot ${pieni(stampati)} ≠ ${pieni(app)}`);
    }
  });
  return differenze;
}

// Privilegi: stessi nomi, livelli e pagine dell'app, testo estratto pulito.
export function differenzePrivilegi(classe: string): string[] {
  const voce = voceClasse(classe);
  const differenze = confrontaPrivilegi(classe, voce.privilegi, (privilegiClassi as Record<string, Concessione[]>)[classe] ?? []);
  for (const sottoclasse of sottoclassiDi(classe)) {
    differenze.push(...confrontaPrivilegi(sottoclasse.nome, sottoclasse.privilegi, (privilegiSottoclassi as Record<string, Concessione[]>)[sottoclasse.nome] ?? []));
  }
  const testi = [voce, ...sottoclassiDi(classe)].flatMap((padre) => [
    [padre.nome, manuale.perId(padre.id)?.descrizione ?? ""],
    ...padre.privilegi.map((item) => [`${padre.nome}: ${item.livello} ${item.nome}`, manuale.perId(item.id)?.descrizione ?? ""]),
  ]);
  for (const [nome, testo] of testi) {
    if (testo.length < 40 || /·|\|/.test(testo) || /^[a-zà-ù]/.test(testo)) differenze.push(`${nome}: testo da controllare`);
  }
  return differenze;
}
