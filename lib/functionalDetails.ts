import type { Sheet } from "./sheet";
import { featGrants, type Grant } from "./characterGrants";
import { privilegioManuale, voceManuale, descrizioneValore } from "./manuale-2024";
import { operationalReminder } from "./operationalReminders";
import { featCatalog } from "./featCatalog";

const featDomains = ["talenti/origini", "talenti/generali-a", "talenti/generali-b", "talenti/stili", "talenti/doni-epici"];

function clean(text: string): string {
  return text.replace(/C A P I T O L O[^]*/, "").replace(/\s+/g, " ").trim();
}

function reminderText(name: string, sheet: Sheet): string | null {
  const reminder = operationalReminder(name, sheet);
  return reminder?.parts.map((part) => typeof part === "string" ? part : part.spell).join("") ?? null;
}

function brief(text: string): string {
  const cleaned = clean(text).replace(/^Il personaggio ottiene i seguenti benefici\.\s*/i, "");
  if (cleaned.length <= 175) return cleaned;
  const end = cleaned.lastIndexOf(" ", 175);
  return `${cleaned.slice(0, end > 100 ? end : 175)}…`;
}

export function grantFunctionalDetails(grant: Grant, sheet: Sheet): { summary: string | null; full: string | null } {
  const manual = privilegioManuale(grant.name, {
    classe: sheet.classe, sottoclasse: sheet.sottoclasse, specie: sheet.specie,
    lignaggio: sheet.lignaggio, livello: grant.level,
  });
  let full = manual?.verificata && manual.descrizione ? clean(manual.descrizione) : null;
  // Alcuni privilegi concessi sono etichette che rimandano a una voce del
  // manuale: il nome della sottoclasse e i tratti di lignaggio. La loro sintesi
  // viene dalla descrizione della voce (stessa fonte dei popup, non una nota).
  if (!full) {
    const voce = grant.name === sheet.sottoclasse ? descrizioneValore("sottoclasse", sheet.sottoclasse)
      : grant.source.startsWith("Lignaggio:") && sheet.lignaggio ? descrizioneValore("lignaggio", sheet.lignaggio)
        : null;
    if (voce?.verificata && voce.descrizione) full = clean(voce.descrizione);
  }
  return { summary: reminderText(grant.name, sheet) ?? (full ? brief(full) : null), full };
}

export function featFunctionalDetails(name: string, sheet: Sheet): { summary: string | null; full: string | null } {
  const manual = featDomains.map((domain) => voceManuale(domain, name)).find((entry) => entry?.verificata && entry.descrizione);
  const full = manual?.descrizione ? clean(manual.descrizione) : null;
  return { summary: reminderText(name, sheet) ?? (full ? brief(full) : null), full };
}

export function displayedFeatGrants(sheet: Sheet) {
  const remaining = [...sheet.talenti];
  const granted = featGrants(sheet).map((grant) => {
    const category = grant.name === "Talento Origini a scelta" ? "origini"
      : grant.name === "Talento Stile di combattimento a scelta" ? "stileDiCombattimento"
        : grant.name === "Dono epico a scelta" ? "donoEpico" : null;
    const index = remaining.findIndex((item) => item.nome.localeCompare(grant.name, "it", { sensitivity: "base" }) === 0
      || category !== null && featCatalog.some((feat) => feat.name === item.nome && feat.category === category)
      || grant.name === "Talento a scelta" && featCatalog.some((feat) => feat.name === item.nome && feat.category === "generali"));
    return { grant, saved: index >= 0 ? remaining.splice(index, 1)[0] : null };
  });
  return { granted, remaining };
}
