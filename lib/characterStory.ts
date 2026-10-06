import type { Sheet } from "./sheet";
import { featGrants, grantedPrivileges, type Grant } from "./characterGrants";
import { featCatalog } from "./featCatalog";
import { proficiencyBonus } from "./abilityBonus";
import { classSavingThrows, classWeaponProficiencies, classArmorProficiencies, classToolProficiencies } from "./classSavingThrows";
import backgrounds from "./manuale-2024-backgrounds.json";

export type StoryEvent = { title: string; details: string[] };

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

function privilegeDetails(grants: Grant[], sheet: Sheet): string[] {
  return grants.flatMap((grant) => {
    const chosen = sheet.privilegi.find((item) => item.titolo.localeCompare(grant.name, "it", { sensitivity: "base" }) === 0)?.scelte.trim();
    const resources = (sheet.risorse ?? []).filter((item) =>
      item.fonte.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it"))
      || item.nome.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it")));
    return [
      `Privilegio: ${grant.name}${chosen ? ` · ${chosen}` : ""}`,
      ...resources.map((item) => `Risorsa: ${item.nome}`),
    ];
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

function featDetails(grants: Grant[], sheet: Sheet, used: Set<number>): string[] {
  return grants.map((grant) => {
    const chosen = findFeatForGrant(grant, sheet, used);
    return chosen ? `Talento: ${chosen}` : `Talento concesso: ${grant.name}`;
  });
}

// Le fasi di creazione e avanzamento seguono il Manuale del Giocatore 2024, pp. 33, 36-42.
// I dati già presenti nella scheda non conservano il momento di ogni scelta: si assegna
// una conseguenza allo step solo quando la sua fonte o il livello sono identificabili.
export function characterStory(sheet: Sheet, name: string): StoryEvent[] {
  const level = Math.max(1, Math.min(20, Number(sheet.livello) || 1));
  const privileges = grantedPrivileges(sheet);
  const feats = featGrants(sheet);
  const usedFeats = new Set<number>();
  const events: StoryEvent[] = [{ title: "Personaggio creato", details: ["Livello 1"] }];

  if (present(sheet.classe)) {
    const hitDie = sheet.dadiVita.match(/d\d+/i)?.[0];
    events.push({
      title: `Scelta classe: ${sheet.classe}`,
      details: [
        ...(hitDie ? [`Dado Vita: ${hitDie}`] : []),
        ...competencyDetails(sheet, "Classe", sheet.classe),
        ...privilegeDetails(privileges.filter((item) => sourceIs(item.source, "Classe", sheet.classe) && item.level === 1), sheet),
        ...(sheet.padronanzeArmi?.length && privileges.some((item) => item.level === 1 && sourceIs(item.source, "Classe", sheet.classe) && item.name.toLocaleLowerCase("it").includes("padronanza"))
          ? [`Padronanze scelte: ${sheet.padronanzeArmi.join(", ")}`] : []),
        ...featDetails(feats.filter((item) => sourceIs(item.source, "Classe", sheet.classe) && featGrantLevel(item, sheet) === 1), sheet, usedFeats),
      ],
    });
  }
  if (present(sheet.background)) {
    events.push({
      title: `Scelto background: ${sheet.background}`,
      details: [
        ...competencyDetails(sheet, "Background", sheet.background),
        ...featDetails(feats.filter((item) => sourceIs(item.source, "Background", sheet.background)), sheet, usedFeats),
      ],
    });
  }
  if (present(sheet.specie)) {
    events.push({
      title: `Scelta specie: ${sheet.specie}`,
      details: [
        ...(present(sheet.lignaggio) ? [`Lignaggio: ${sheet.lignaggio}`] : []),
        ...(present(sheet.taglia) ? [`Taglia: ${sheet.taglia}`] : []),
        ...(present(sheet.velocita) ? [`Velocità: ${sheet.velocita} m`] : []),
        ...competencyDetails(sheet, "Specie", sheet.specie),
        ...privilegeDetails(privileges.filter((item) => sourceIs(item.source, "Specie", sheet.specie) && (!item.level || item.level === 1)
          || present(sheet.lignaggio) && sourceIs(item.source, "Lignaggio", sheet.lignaggio)), sheet),
        ...featDetails(feats.filter((item) => sourceIs(item.source, "Specie", sheet.specie)), sheet, usedFeats),
      ],
    });
  }
  if (sheet.lingue.length) events.push({ title: "Scelte le lingue", details: [sheet.lingue.join(", ")] });
  const scores = sheet.caratteristiche.filter((item) => present(item.valore));
  if (scores.length) events.push({ title: "Determinati i punteggi di caratteristica", details: scores.map((item) => `${item.abbr} ${item.valore}`) });
  if (present(sheet.allineamento)) events.push({ title: `Scelto allineamento: ${sheet.allineamento}`, details: [] });
  const initialDetails = [
    `Nome: ${name || "Senza nome"}`,
    ...(present(sheet.puntiFeritaMax) && level === 1 ? [`Punti ferita massimi: ${sheet.puntiFeritaMax}`] : []),
  ];
  events.push({ title: "Inseriti i dettagli", details: initialDetails });

  for (let current = 2; current <= level; current++) {
    const levelPrivileges = privileges.filter((item) => item.level === current);
    const levelFeats = feats.filter((item) => featGrantLevel(item, sheet) === current);
    const details = [
      "Dado Vita aggiunto; punti ferita massimi aumentati",
      ...privilegeDetails(levelPrivileges, sheet),
      ...featDetails(levelFeats, sheet, usedFeats),
    ];
    const previousBonus = proficiencyBonus(String(current - 1));
    const nextBonus = proficiencyBonus(String(current));
    if (previousBonus !== nextBonus) details.push(`Bonus di competenza: ${nextBonus}`);
    events.push({ title: `Raggiunto livello ${current}`, details });
  }

  const remaining = sheet.talenti.filter((_, index) => !usedFeats.has(index)).map((item) =>
    `Talento: ${item.nome}${present(item.scelte) ? ` · ${item.scelte.trim()}` : ""}`);
  const recordedPrivileges = sheet.privilegi.filter((item) => !privileges.some((grant) => grant.name.localeCompare(item.titolo, "it", { sensitivity: "base" }) === 0)).map((item) =>
    `Privilegio: ${item.titolo}${present(item.scelte) ? ` · ${item.scelte.trim()}` : ""}`);
  const spells = sheet.incantesimi.filter((item) => present(item.nome)).map((item) => `Incantesimo: ${item.nome}`);
  const current = [
    ...(present(sheet.dadiVita) && level > 1 ? [`Dadi Vita: ${sheet.dadiVita}`] : []),
    ...(present(sheet.puntiFeritaMax) && level > 1 ? [`Punti ferita massimi: ${sheet.puntiFeritaMax}`] : []),
    ...(sheet.equipaggiamento.length ? [`Equipaggiamento: ${sheet.equipaggiamento.map((item) => item.nome).join(", ")}`] : []),
    ...remaining, ...recordedPrivileges, ...spells,
  ];
  if (current.length) events.push({ title: "Stato attuale", details: current });
  return events;
}
