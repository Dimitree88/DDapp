// Tabella Armi, Manuale del Giocatore 2024, p. 215: proprietà come stampate
// (verificate dal modulo E01, lib/manuale-2024/equipaggiamento/armi.json).
// Gli ID restano stabili anche se un nome visualizzato viene corretto.
export type WeaponCatalogEntry = {
  id: string;
  name: string;
  category: "semplici" | "daGuerra";
  kind: "mischia" | "distanza";
  finesse?: true;
  thrown?: true;
  versatileDie?: string;
  weightKg?: number;
  costGp: number;
  rangeMeters?: readonly [number, number];
  damage: string;
  properties: string;
  mastery: string;
  source: "Manuale del Giocatore 2024";
  pages: "215";
};

export const weaponCatalog: readonly WeaponCatalogEntry[] = [
  { id: "ascia", name: "Ascia", category: "semplici", kind: "mischia", thrown: true, weightKg: 1, costGp: 5, rangeMeters: [6, 18], damage: "1d6 taglienti", properties: "Lancio (gittata 6/18), leggera", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "bastone-ferrato", name: "Bastone ferrato", category: "semplici", kind: "mischia", versatileDie: "1d8", weightKg: 2, costGp: 0.2, damage: "1d6 contundenti", properties: "Versatile (1d8)", mastery: "Rovesciamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "falcetto", name: "Falcetto", category: "semplici", kind: "mischia", weightKg: 1, costGp: 1, damage: "1d4 taglienti", properties: "Leggera", mastery: "Graffio", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "giavellotto", name: "Giavellotto", category: "semplici", kind: "mischia", thrown: true, weightKg: 1, costGp: 0.5, rangeMeters: [9, 36], damage: "1d6 perforanti", properties: "Lancio (gittata 9/36)", mastery: "Lentezza", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "lancia", name: "Lancia", category: "semplici", kind: "mischia", thrown: true, versatileDie: "1d8", weightKg: 1.5, costGp: 1, rangeMeters: [6, 18], damage: "1d6 perforanti", properties: "Lancio (gittata 6/18), versatile (1d8)", mastery: "Prosciugamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "martello-leggero", name: "Martello leggero", category: "semplici", kind: "mischia", thrown: true, weightKg: 1, costGp: 2, rangeMeters: [6, 18], damage: "1d4 contundenti", properties: "Lancio (gittata 6/18), leggera", mastery: "Graffio", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "mazza", name: "Mazza", category: "semplici", kind: "mischia", weightKg: 2, costGp: 5, damage: "1d6 contundenti", properties: "—", mastery: "Prosciugamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "pugnale", name: "Pugnale", category: "semplici", kind: "mischia", finesse: true, thrown: true, weightKg: 0.5, costGp: 2, rangeMeters: [6, 18], damage: "1d4 perforanti", properties: "Accurata, lancio (gittata 6/18), leggera", mastery: "Graffio", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "randello-pesante", name: "Randello pesante", category: "semplici", kind: "mischia", weightKg: 5, costGp: 0.2, damage: "1d8 contundenti", properties: "Due mani", mastery: "Spinta", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "randello", name: "Randello", category: "semplici", kind: "mischia", weightKg: 1, costGp: 0.1, damage: "1d4 contundenti", properties: "Leggera", mastery: "Lentezza", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "arco-corto", name: "Arco corto", category: "semplici", kind: "distanza", weightKg: 1, costGp: 25, rangeMeters: [24, 96], damage: "1d6 perforanti", properties: "Due mani, munizioni (gittata 24/96; freccia)", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "balestra-leggera", name: "Balestra leggera", category: "semplici", kind: "distanza", weightKg: 2.5, costGp: 25, rangeMeters: [24, 96], damage: "1d8 perforanti", properties: "Due mani, munizioni (gittata 24/96; quadrello), ricarica", mastery: "Lentezza", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "dardo", name: "Dardo", category: "semplici", kind: "distanza", finesse: true, thrown: true, weightKg: 0.125, costGp: 0.05, rangeMeters: [6, 18], damage: "1d4 perforanti", properties: "Accurata, lancio (gittata 6/18)", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "fionda", name: "Fionda", category: "semplici", kind: "distanza", costGp: 0.1, rangeMeters: [9, 36], damage: "1d4 contundenti", properties: "Munizioni (gittata 9/36; proiettile)", mastery: "Lentezza", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "alabarda", name: "Alabarda", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 20, damage: "1d10 taglienti", properties: "Due mani, pesante, portata", mastery: "Doppio fendente", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "ascia-bipenne", name: "Ascia bipenne", category: "daGuerra", kind: "mischia", weightKg: 3.5, costGp: 30, damage: "1d12 taglienti", properties: "Due mani, pesante", mastery: "Doppio fendente", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "ascia-da-battaglia", name: "Ascia da battaglia", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 2, costGp: 10, damage: "1d8 taglienti", properties: "Versatile (1d10)", mastery: "Rovesciamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "falcione", name: "Falcione", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 20, damage: "1d10 taglienti", properties: "Due mani, pesante, portata", mastery: "Colpo di striscio", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "frusta", name: "Frusta", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1.5, costGp: 2, damage: "1d4 taglienti", properties: "Accurata, portata", mastery: "Lentezza", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "lancia-da-cavaliere", name: "Lancia da cavaliere", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 10, damage: "1d10 perforanti", properties: "Due mani (eccetto in sella), pesante, portata", mastery: "Rovesciamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "maglio", name: "Maglio", category: "daGuerra", kind: "mischia", weightKg: 5, costGp: 10, damage: "2d6 contundenti", properties: "Due mani, pesante", mastery: "Rovesciamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "martello-da-guerra", name: "Martello da guerra", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 2.5, costGp: 15, damage: "1d8 contundenti", properties: "Versatile (1d10)", mastery: "Spinta", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "mazza-chiodata", name: "Mazza chiodata", category: "daGuerra", kind: "mischia", weightKg: 2, costGp: 15, damage: "1d8 perforanti", properties: "—", mastery: "Prosciugamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "mazzafrusto", name: "Mazzafrusto", category: "daGuerra", kind: "mischia", weightKg: 1, costGp: 10, damage: "1d8 contundenti", properties: "—", mastery: "Prosciugamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "picca", name: "Picca", category: "daGuerra", kind: "mischia", weightKg: 9, costGp: 5, damage: "1d10 perforanti", properties: "Due mani, pesante, portata", mastery: "Spinta", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "piccone-da-guerra", name: "Piccone da guerra", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 1, costGp: 5, damage: "1d8 perforanti", properties: "Versatile (1d10)", mastery: "Prosciugamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "scimitarra", name: "Scimitarra", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1.5, costGp: 25, damage: "1d6 taglienti", properties: "Accurata, leggera", mastery: "Graffio", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "spada-corta", name: "Spada corta", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1, costGp: 10, damage: "1d6 perforanti", properties: "Accurata, leggera", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "spada-lunga", name: "Spada lunga", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 1.5, costGp: 15, damage: "1d8 taglienti", properties: "Versatile (1d10)", mastery: "Prosciugamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "spadone", name: "Spadone", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 50, damage: "2d6 taglienti", properties: "Due mani, pesante", mastery: "Colpo di striscio", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "stocco", name: "Stocco", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1, costGp: 25, damage: "1d8 perforanti", properties: "Accurata", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "tridente", name: "Tridente", category: "daGuerra", kind: "mischia", thrown: true, versatileDie: "1d10", weightKg: 2, costGp: 5, rangeMeters: [6, 18], damage: "1d8 perforanti", properties: "Lancio (gittata 6/18), versatile (1d10)", mastery: "Rovesciamento", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "arco-lungo", name: "Arco lungo", category: "daGuerra", kind: "distanza", weightKg: 1, costGp: 50, rangeMeters: [45, 180], damage: "1d8 perforanti", properties: "Due mani, munizioni (gittata 45/180; freccia), pesante", mastery: "Lentezza", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "balestra-a-mano", name: "Balestra a mano", category: "daGuerra", kind: "distanza", weightKg: 1.5, costGp: 75, rangeMeters: [9, 36], damage: "1d6 perforanti", properties: "Leggera, munizioni (gittata 9/36; quadrello), ricarica", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "balestra-pesante", name: "Balestra pesante", category: "daGuerra", kind: "distanza", weightKg: 9, costGp: 50, rangeMeters: [30, 120], damage: "1d10 perforanti", properties: "Due mani, munizioni (gittata 30/120; quadrello), pesante, ricarica", mastery: "Spinta", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "cerbottana", name: "Cerbottana", category: "daGuerra", kind: "distanza", weightKg: 0.5, costGp: 10, rangeMeters: [7, 30], damage: "1 perforante", properties: "Munizioni (gittata 7/30; ago), ricarica", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "moschetto", name: "Moschetto", category: "daGuerra", kind: "distanza", weightKg: 5, costGp: 500, rangeMeters: [12, 36], damage: "1d12 perforanti", properties: "Due mani, munizioni (gittata 12/36; proiettile), ricarica", mastery: "Lentezza", source: "Manuale del Giocatore 2024", pages: "215" },
  { id: "pistola", name: "Pistola", category: "daGuerra", kind: "distanza", weightKg: 1.5, costGp: 250, rangeMeters: [9, 27], damage: "1d10 perforanti", properties: "Munizioni (gittata 9/27; proiettile), ricarica", mastery: "Vessazione", source: "Manuale del Giocatore 2024", pages: "215" },
];

export const weaponNames = weaponCatalog.map((weapon) => weapon.name);

export function weaponByName(name: string): WeaponCatalogEntry | null {
  return weaponCatalog.find((weapon) => weapon.name === name) ?? null;
}

export function weaponDetails(name: string): string | null {
  if (name === "Armi semplici" || name === "Armi da guerra") {
    const category = name === "Armi semplici" ? "semplici" : "daGuerra";
    return `Comprende: ${weaponCatalog.filter((weapon) => weapon.category === category).map((weapon) => weapon.name).join(", ")}.`;
  }
  const weapon = weaponByName(name);
  if (!weapon) return null;
  return `${weapon.category === "semplici" ? "Arma semplice" : "Arma da guerra"} ${weapon.kind === "distanza" ? "a distanza" : "da mischia"}. Danni: ${weapon.damage}. Proprietà: ${weapon.properties}. Padronanza: ${weapon.mastery} (solo se il personaggio la possiede).${weapon.weightKg === undefined ? "" : ` Peso: ${weapon.weightKg} kg.`} Costo: ${weapon.costGp} mo.`;
}
