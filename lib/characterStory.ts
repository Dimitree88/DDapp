import type { Sheet } from "./sheet";
import { featGrants, grantedPrivileges, type Grant } from "./characterGrants";
import { featCatalog } from "./featCatalog";
import { proficiencyBonus } from "./abilityBonus";
import { classSavingThrows, classWeaponProficiencies, classArmorProficiencies, classToolProficiencies } from "./classSavingThrows";
import backgrounds from "./manuale-2024-backgrounds.json";
import { privilegioManuale, voceManuale } from "./manuale-2024";

export type StoryDetail = { label: string; consequences?: string[] };
export type StoryEvent = { title: string; details: StoryDetail[] };

const present = (value: string | undefined) => Boolean(value?.trim());
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
const sourceIs = (source: string, kind: string, name: string) => source.toLocaleLowerCase("it") === `${kind}: ${name}`.toLocaleLowerCase("it");

function competencyDetails(sheet: Sheet, kind: string, name: string): string[] {
  const records = (sheet.fontiCompetenze ?? []).filter((item) => sourceIs(item.fonte, kind, name));
  const labels: Record<string, string> = {
    abilita: "Abilità", tiroSalvezza: "Tiri salvezza", arma: "Armi",
    armatura: "Armature", strumento: "Strumenti", lingua: "Lingue",
  };
  return Object.entries(labels).flatMap(([type, label]) => {
    const recorded = records.filter((item) => item.tipo === type).map((item) => item.valore);
    const background = kind === "Background" ? (backgrounds as Record<string, { skills?: string[]; tool?: string }>)[name] : undefined;
    const inherited = kind === "Classe" && type === "tiroSalvezza" ? [...(classSavingThrows[name] ?? [])]
      : kind === "Classe" && type === "arma" ? [...classWeaponProficiencies(name)]
        : kind === "Classe" && type === "armatura" ? [...classArmorProficiencies(name)]
        : kind === "Classe" && type === "strumento" ? [...classToolProficiencies(name)]
          : type === "abilita" ? background?.skills ?? []
            : type === "strumento" && background?.tool ? [background.tool] : [];
    const values = unique([...inherited, ...recorded]);
    return values.length ? [`${label}: ${values.join(", ")}`] : [];
  });
}

const detail = (label: string): StoryDetail => ({ label });
const paragraphs = (description: string | null | undefined) => description?.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean) ?? [];

function privilegeDetails(grants: Grant[], sheet: Sheet): StoryDetail[] {
  return grants.flatMap((grant) => {
    const chosen = sheet.privilegi.find((item) => item.titolo.localeCompare(grant.name, "it", { sensitivity: "base" }) === 0)?.scelte.trim();
    const manual = privilegioManuale(grant.name, {
      classe: sheet.classe, sottoclasse: sheet.sottoclasse,
      specie: sheet.specie, lignaggio: sheet.lignaggio, livello: grant.level,
    });
    return [{
      label: `Privilegio: ${grant.name}${chosen ? ` · ${chosen}` : ""}`,
      consequences: paragraphs(manual?.descrizione),
    }];
  });
}

function findFeatForGrant(grant: Grant, sheet: Sheet, used: Set<number>): string | null {
  const isChoice = grant.name.includes("a scelta");
  const category = grant.name === "Talento Origini a scelta" ? "origini"
    : grant.name === "Talento Stile di combattimento a scelta" ? "stileDiCombattimento"
      : grant.name === "Dono epico a scelta" ? "donoEpico" : null;
  const index = sheet.talenti.findIndex((feat, i) => {
    if (used.has(i) || !present(feat.nome)) return false;
    if (!isChoice) return feat.nome.toLocaleLowerCase("it") === grant.name.toLocaleLowerCase("it")
      || grant.name.toLocaleLowerCase("it").startsWith(`${feat.nome.toLocaleLowerCase("it")} (`);
    const entry = featCatalog.find((candidate) => candidate.name === feat.nome);
    return category === "origini" || category === "stileDiCombattimento"
      ? entry?.category === category : Boolean(entry);
  });
  if (index < 0) return null;
  used.add(index);
  const feat = sheet.talenti[index];
  return `${feat.nome}${present(feat.scelte) ? ` · ${feat.scelte.trim()}` : ""}`;
}

function featGrantLevel(grant: Grant, sheet: Sheet): number {
  if (grant.level) return grant.level;
  if (grant.name === "Talento Stile di combattimento a scelta") {
    if (grant.source.startsWith("Sottoclasse:")) return 7;
    return sheet.classe === "Guerriero" ? 1 : 2;
  }
  return 1;
}

function featDetails(grants: Grant[], sheet: Sheet, used: Set<number>): StoryDetail[] {
  return grants.map((grant) => {
    const chosen = findFeatForGrant(grant, sheet, used);
    const featName = chosen?.split(" · ")[0] ?? grant.name;
    const category = featCatalog.find((entry) => entry.name === featName)?.category;
    const domain = category === "origini" ? "talenti/origini"
      : category === "stileDiCombattimento" ? "talenti/stili"
        : category === "donoEpico" ? "talenti/doni-epici" : null;
    const manual = domain ? voceManuale(domain, featName)
      : voceManuale("talenti/generali-a", featName) ?? voceManuale("talenti/generali-b", featName);
    return {
      label: chosen ? `Talento: ${chosen}` : `Talento concesso: ${grant.name}`,
      consequences: paragraphs(manual?.descrizione),
    };
  });
}

// Le fasi di creazione e avanzamento seguono il Manuale del Giocatore 2024, pp. 33, 36-42.
// I dati già presenti nella scheda non conservano il momento di ogni scelta: si assegna
// una conseguenza allo step solo quando la sua fonte o il livello sono identificabili.
export function characterStory(sheet: Sheet, hitPointGains: Sheet["incrementiPf"] = []): StoryEvent[] {
  const level = Math.max(1, Math.min(20, Number(sheet.livello) || 1));
  const privileges = grantedPrivileges(sheet);
  const feats = featGrants(sheet);
  const usedFeats = new Set<number>();
  const events: StoryEvent[] = [{ title: "Personaggio creato", details: [detail("Livello 1")] }];

  if (present(sheet.classe)) {
    const hitDie = sheet.dadiVita.match(/d\d+/i)?.[0];
    events.push({
      title: `Scelta classe: ${sheet.classe}`,
      details: [
        ...(hitDie ? [detail(`Dado Vita: ${hitDie}`)] : []),
        ...competencyDetails(sheet, "Classe", sheet.classe).map(detail),
        ...privilegeDetails(privileges.filter((item) => sourceIs(item.source, "Classe", sheet.classe) && item.level === 1), sheet),
        ...(sheet.padronanzeArmi?.length && privileges.some((item) => item.level === 1 && sourceIs(item.source, "Classe", sheet.classe) && item.name.toLocaleLowerCase("it").includes("padronanza"))
          ? [detail(`Padronanze scelte: ${sheet.padronanzeArmi.join(", ")}`)] : []),
        ...featDetails(feats.filter((item) => sourceIs(item.source, "Classe", sheet.classe) && featGrantLevel(item, sheet) === 1), sheet, usedFeats),
      ],
    });
  }
  if (present(sheet.background)) {
    events.push({
      title: `Scelto background: ${sheet.background}`,
      details: [
        ...competencyDetails(sheet, "Background", sheet.background).map(detail),
        ...featDetails(feats.filter((item) => sourceIs(item.source, "Background", sheet.background)), sheet, usedFeats),
      ],
    });
  }
  if (present(sheet.specie)) {
    events.push({
      title: `Scelta specie: ${sheet.specie}`,
      details: [
        ...(present(sheet.lignaggio) ? [detail(`Lignaggio: ${sheet.lignaggio}`)] : []),
        ...(present(sheet.taglia) ? [detail(`Taglia: ${sheet.taglia}`)] : []),
        ...(present(sheet.velocita) ? [detail(`Velocità: ${sheet.velocita} m`)] : []),
        ...competencyDetails(sheet, "Specie", sheet.specie).map(detail),
        ...privilegeDetails(privileges.filter((item) => sourceIs(item.source, "Specie", sheet.specie) && (!item.level || item.level === 1)
          || present(sheet.lignaggio) && sourceIs(item.source, "Lignaggio", sheet.lignaggio)), sheet),
        ...featDetails(feats.filter((item) => sourceIs(item.source, "Specie", sheet.specie)), sheet, usedFeats),
      ],
    });
  }
  if (sheet.lingue.length) events.push({ title: "Scelte le lingue", details: [detail(sheet.lingue.join(", "))] });
  const scores = sheet.caratteristiche.filter((item) => present(item.valore));
  if (scores.length) events.push({ title: "Determinati i punteggi di caratteristica", details: scores.map((item) => detail(`${item.abbr} ${item.valore}`)) });
  if (present(sheet.allineamento)) events.push({ title: `Scelto allineamento: ${sheet.allineamento}`, details: [] });
  if (present(sheet.puntiFeritaMax) && level === 1) events.push({ title: "Determinati i punti ferita iniziali", details: [detail(`Punti ferita massimi: ${sheet.puntiFeritaMax}`)] });

  for (let current = 2; current <= level; current++) {
    const levelPrivileges = privileges.filter((item) => item.level === current);
    const levelFeats = feats.filter((item) => featGrantLevel(item, sheet) === current);
    const gain = hitPointGains?.[current - 2];
    const hitDie = sheet.dadiVita.match(/d\d+/i)?.[0];
    const result = gain ? ` · ${gain.method === "fisso" ? "Valore fisso" : "Tiro"}: ${gain.value}` : "";
    const details: StoryDetail[] = [
      detail(`Dado Vita aggiunto${hitDie ? `: 1${hitDie} (${current}${hitDie} totali)` : ""}${result}`),
      ...privilegeDetails(levelPrivileges, sheet),
      ...featDetails(levelFeats, sheet, usedFeats),
    ];
    const previousBonus = proficiencyBonus(String(current - 1));
    const nextBonus = proficiencyBonus(String(current));
    if (previousBonus !== nextBonus) details.push(detail(`Bonus di competenza: ${nextBonus}`));
    events.push({ title: `Raggiunto livello ${current}`, details });
  }
  return events;
}
