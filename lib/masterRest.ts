import type { Risorsa, Sheet } from "./sheet";
import { spellSlots } from "./spellcasting";

export type RestKind = "breve" | "lungo";

function recoveryRule(resource: Risorsa, rest: RestKind): "all" | "one" | "none" {
  const rule = resource.ricarica.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it").replace(/\s+/g, " ").trim();
  if (!rule) return "none";
  const matchesRest = rest === "lungo" ? /riposo lungo/.test(rule) : /riposo breve/.test(rule);
  if (!matchesRest) return "none";
  if (/\b(?:1|un|uno|una)\b/.test(rule)) return "one";
  if (rest === "breve" && /riposo breve o lungo/.test(rule)) return "all";
  if (rest === "breve" && /^riposo breve$/.test(rule)) return "all";
  if (rest === "lungo" && /riposo lungo/.test(rule)) return "all";
  return "none";
}

export function rechargeResources(resources: Risorsa[], rest: RestKind): Risorsa[] {
  return resources.map((resource) => {
    const recovery = recoveryRule(resource, rest);
    if (recovery === "all") return { ...resource, spesi: 0 };
    if (recovery === "one") return { ...resource, spesi: Math.max(0, resource.spesi - 1) };
    return resource;
  });
}

export function rechargeSpellSlots(sheet: Sheet, rest: RestKind): Record<string, number> {
  if (rest === "breve" && sheet.classe !== "Warlock") return sheet.slotSpesi ?? {};
  return Object.fromEntries(spellSlots(sheet).map((slot) => [String(slot.level), 0]));
}

export function hitDieSize(sheet: Sheet): number | null {
  const match = /(?:^|\s)(?:\d+)?\s*d(\d+)/i.exec(sheet.dadiVita);
  if (!match) return null;
  const size = Number(match[1]);
  return Number.isInteger(size) && size >= 2 && size <= 20 ? size : null;
}

export function hitDiceTotal(sheet: Sheet): number | null {
  const match = /^\s*(\d+)\s*d\d+\s*$/i.exec(sheet.dadiVita);
  if (match) return Number(match[1]);
  const level = Number(sheet.livello);
  return Number.isInteger(level) && level >= 1 && level <= 20 ? level : null;
}
