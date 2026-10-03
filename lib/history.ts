import type { Sheet } from "./sheet";

export type HistoryChange = {
  field: string;
  before: string;
  after: string;
};

const labels: Record<string, string> = {
  livello: "Livello", classe: "Classe", sottoclasse: "Sottoclasse",
  puntiFerita: "Punti ferita", puntiFeritaMax: "Punti ferita massimi",
  classeArmatura: "Classe armatura", noteClasseArmatura: "Note classe armatura",
  scudo: "Scudo", iniziativa: "Iniziativa", bonusCompetenza: "Bonus competenza",
  percezionePassiva: "Percezione passiva", dadiVita: "Dadi vita",
  ispirazioneEroica: "Ispirazione eroica", puntiEsperienza: "Punti esperienza",
  specie: "Specie", lignaggio: "Lignaggio", background: "Background",
  allineamento: "Allineamento", velocita: "Velocità", noteVelocita: "Note velocità",
  taglia: "Taglia", lingue: "Lingue", noteLingue: "Note lingue",
  caratteristiche: "Caratteristiche", abilita: "Abilità",
  competenzeArmi: "Competenze armi", armi: "Armi",
  competenzeArmatura: "Competenze armatura", equipaggiamento: "Equipaggiamento",
  privilegi: "Privilegi", talenti: "Talenti", incantesimi: "Incantesimi",
  monete: "Monete", note: "Note",
  nome: "Nome", abbr: "Abbreviazione", valore: "Valore", modificatore: "Modificatore",
  tsBonus: "Bonus tiro salvezza", tsCompetente: "Tiro salvezza competente",
  caratteristica: "Caratteristica", competente: "Competente", bonus: "Bonus",
  quantita: "Quantità", danno: "Danno", gittata: "Gittata", provenienza: "Provenienza",
  dettaglio: "Dettaglio", titolo: "Titolo", descrizione: "Descrizione",
  tempo: "Tempo di lancio", componenti: "Componenti", durata: "Durata",
  concentrazione: "Concentrazione", rituale: "Rituale", materiali: "Materiali",
  leggere: "Leggere", medie: "Medie", pesanti: "Pesanti", scudi: "Scudi",
  rame: "Rame", argento: "Argento", electrum: "Electrum", oro: "Oro", platino: "Platino",
};

function show(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value, null, 2);
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function itemName(before: unknown, after: unknown, index: number): string {
  const candidate = (after ?? before) as { nome?: string; titolo?: string } | null;
  return candidate?.nome || candidate?.titolo || String(index + 1);
}

export function diffSheet(before: Sheet, after: Sheet): HistoryChange[] {
  const changes: HistoryChange[] = [];
  const add = (field: string, oldValue: unknown, newValue: unknown) => {
    changes.push({ field, before: show(oldValue), after: show(newValue) });
  };
  const walk = (oldValue: unknown, newValue: unknown, field: string) => {
    if (same(oldValue, newValue)) return;
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (oldValue.length === newValue.length) {
        oldValue.forEach((item, index) => walk(item, newValue[index], `${field} · ${itemName(item, newValue[index], index)}`));
        return;
      }
      if (newValue.length === oldValue.length + 1) {
        const index = newValue.findIndex((_, candidate) => same(newValue.filter((__, i) => i !== candidate), oldValue));
        if (index >= 0) {
          add(`${field} · aggiunta`, undefined, newValue[index]);
          return;
        }
      }
      if (oldValue.length === newValue.length + 1) {
        const index = oldValue.findIndex((_, candidate) => same(oldValue.filter((__, i) => i !== candidate), newValue));
        if (index >= 0) {
          add(`${field} · rimozione`, oldValue[index], undefined);
          return;
        }
      }
      add(field, oldValue, newValue);
      return;
    }
    if (oldValue && newValue && typeof oldValue === "object" && typeof newValue === "object") {
      const oldObject = oldValue as Record<string, unknown>;
      const newObject = newValue as Record<string, unknown>;
      for (const key of new Set([...Object.keys(oldObject), ...Object.keys(newObject)])) {
        walk(oldObject[key], newObject[key], `${field} · ${labels[key] ?? key}`);
      }
      return;
    }
    add(field, oldValue, newValue);
  };
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    walk(before[key as keyof Sheet], after[key as keyof Sheet], labels[key] ?? key);
  }
  return changes;
}
