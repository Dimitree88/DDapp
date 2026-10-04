// Tabella Armi, SRD 5.2.1 italiano, pp. 103-104.
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
  source: "SRD 5.2.1";
  pages: "103-104";
};

export const weaponCatalog: readonly WeaponCatalogEntry[] = [
  { id: "ascia", name: "Ascia", category: "semplici", kind: "mischia", thrown: true, weightKg: 1, costGp: 5, rangeMeters: [6, 18], damage: "1d6 taglienti", properties: "Lancio (6/18 m), leggera", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
  { id: "bastone-ferrato", name: "Bastone ferrato", category: "semplici", kind: "mischia", versatileDie: "1d8", weightKg: 2, costGp: 0.2, damage: "1d6 contundenti", properties: "Versatile (1d8)", mastery: "Rovesciamento", source: "SRD 5.2.1", pages: "103-104" },
  { id: "falcetto", name: "Falcetto", category: "semplici", kind: "mischia", weightKg: 1, costGp: 1, damage: "1d4 taglienti", properties: "Leggera", mastery: "Graffio", source: "SRD 5.2.1", pages: "103-104" },
  { id: "giavellotto", name: "Giavellotto", category: "semplici", kind: "mischia", thrown: true, weightKg: 1, costGp: 0.5, rangeMeters: [9, 36], damage: "1d6 perforanti", properties: "Lancio (9/36 m)", mastery: "Lentezza", source: "SRD 5.2.1", pages: "103-104" },
  { id: "lancia", name: "Lancia", category: "semplici", kind: "mischia", thrown: true, versatileDie: "1d8", weightKg: 1.5, costGp: 1, rangeMeters: [6, 18], damage: "1d6 perforanti", properties: "Lancio (6/18 m), versatile (1d8)", mastery: "Fiaccare", source: "SRD 5.2.1", pages: "103-104" },
  { id: "martello-leggero", name: "Martello leggero", category: "semplici", kind: "mischia", thrown: true, weightKg: 1, costGp: 2, rangeMeters: [6, 18], damage: "1d4 contundenti", properties: "Lancio (6/18 m), leggera", mastery: "Graffio", source: "SRD 5.2.1", pages: "103-104" },
  { id: "mazza", name: "Mazza", category: "semplici", kind: "mischia", weightKg: 2, costGp: 5, damage: "1d6 contundenti", properties: "Nessuna", mastery: "Fiaccare", source: "SRD 5.2.1", pages: "103-104" },
  { id: "pugnale", name: "Pugnale", category: "semplici", kind: "mischia", finesse: true, thrown: true, weightKg: 0.5, costGp: 2, rangeMeters: [6, 18], damage: "1d4 perforanti", properties: "Accurata, lancio (6/18 m), leggera", mastery: "Graffio", source: "SRD 5.2.1", pages: "103-104" },
  { id: "randello-pesante", name: "Randello pesante", category: "semplici", kind: "mischia", weightKg: 5, costGp: 0.2, damage: "1d8 contundenti", properties: "Due mani", mastery: "Spinta", source: "SRD 5.2.1", pages: "103-104" },
  { id: "randello", name: "Randello", category: "semplici", kind: "mischia", weightKg: 1, costGp: 0.1, damage: "1d4 contundenti", properties: "Leggera", mastery: "Lentezza", source: "SRD 5.2.1", pages: "103-104" },
  { id: "arco-corto", name: "Arco corto", category: "semplici", kind: "distanza", weightKg: 1, costGp: 25, rangeMeters: [24, 96], damage: "1d6 perforanti", properties: "Due mani, munizioni (24/96 m; frecce)", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
  { id: "balestra-leggera", name: "Balestra leggera", category: "semplici", kind: "distanza", weightKg: 2.5, costGp: 25, rangeMeters: [24, 96], damage: "1d8 perforanti", properties: "Due mani, munizioni (24/96 m; quadrelli), ricarica", mastery: "Lentezza", source: "SRD 5.2.1", pages: "103-104" },
  { id: "dardo", name: "Dardo", category: "semplici", kind: "distanza", finesse: true, thrown: true, weightKg: 0.125, costGp: 0.05, rangeMeters: [6, 18], damage: "1d4 perforanti", properties: "Accurata, lancio (6/18 m)", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
  { id: "fionda", name: "Fionda", category: "semplici", kind: "distanza", costGp: 0.1, rangeMeters: [9, 36], damage: "1d4 contundenti", properties: "Munizioni (9/36 m; proiettili)", mastery: "Lentezza", source: "SRD 5.2.1", pages: "103-104" },
  { id: "alabarda", name: "Alabarda", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 20, damage: "1d10 taglienti", properties: "Due mani, pesante, portata", mastery: "Doppio fendente", source: "SRD 5.2.1", pages: "103-104" },
  { id: "ascia-bipenne", name: "Ascia bipenne", category: "daGuerra", kind: "mischia", weightKg: 3.5, costGp: 30, damage: "1d12 taglienti", properties: "Due mani, pesante", mastery: "Doppio fendente", source: "SRD 5.2.1", pages: "103-104" },
  { id: "ascia-da-battaglia", name: "Ascia da battaglia", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 2, costGp: 10, damage: "1d8 taglienti", properties: "Versatile (1d10)", mastery: "Rovesciamento", source: "SRD 5.2.1", pages: "103-104" },
  { id: "falcione", name: "Falcione", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 20, damage: "1d10 taglienti", properties: "Due mani, pesante, portata", mastery: "Colpo di striscio", source: "SRD 5.2.1", pages: "103-104" },
  { id: "frusta", name: "Frusta", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1.5, costGp: 2, damage: "1d4 taglienti", properties: "Accurata, portata", mastery: "Lentezza", source: "SRD 5.2.1", pages: "103-104" },
  { id: "lancia-da-cavaliere", name: "Lancia da cavaliere", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 10, damage: "1d10 perforanti", properties: "Due mani (eccetto in sella), pesante, portata", mastery: "Rovesciamento", source: "SRD 5.2.1", pages: "103-104" },
  { id: "maglio", name: "Maglio", category: "daGuerra", kind: "mischia", weightKg: 5, costGp: 10, damage: "2d6 contundenti", properties: "Due mani, pesante", mastery: "Rovesciamento", source: "SRD 5.2.1", pages: "103-104" },
  { id: "martello-da-guerra", name: "Martello da guerra", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 2.5, costGp: 15, damage: "1d8 contundenti", properties: "Versatile (1d10)", mastery: "Spinta", source: "SRD 5.2.1", pages: "103-104" },
  { id: "mazza-chiodata", name: "Mazza chiodata", category: "daGuerra", kind: "mischia", weightKg: 2, costGp: 15, damage: "1d8 perforanti", properties: "Nessuna", mastery: "Fiaccare", source: "SRD 5.2.1", pages: "103-104" },
  { id: "mazzafrusto", name: "Mazzafrusto", category: "daGuerra", kind: "mischia", weightKg: 1, costGp: 10, damage: "1d8 contundenti", properties: "Nessuna", mastery: "Fiaccare", source: "SRD 5.2.1", pages: "103-104" },
  { id: "picca", name: "Picca", category: "daGuerra", kind: "mischia", weightKg: 9, costGp: 5, damage: "1d10 perforanti", properties: "Due mani, pesante, portata", mastery: "Spinta", source: "SRD 5.2.1", pages: "103-104" },
  { id: "piccone-da-guerra", name: "Piccone da guerra", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 1, costGp: 5, damage: "1d8 perforanti", properties: "Versatile (1d10)", mastery: "Fiaccare", source: "SRD 5.2.1", pages: "103-104" },
  { id: "scimitarra", name: "Scimitarra", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1.5, costGp: 25, damage: "1d6 taglienti", properties: "Accurata, leggera", mastery: "Graffio", source: "SRD 5.2.1", pages: "103-104" },
  { id: "spada-corta", name: "Spada corta", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1, costGp: 10, damage: "1d6 perforanti", properties: "Accurata, leggera", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
  { id: "spada-lunga", name: "Spada lunga", category: "daGuerra", kind: "mischia", versatileDie: "1d10", weightKg: 1.5, costGp: 15, damage: "1d8 taglienti", properties: "Versatile (1d10)", mastery: "Fiaccare", source: "SRD 5.2.1", pages: "103-104" },
  { id: "spadone", name: "Spadone", category: "daGuerra", kind: "mischia", weightKg: 3, costGp: 50, damage: "2d6 taglienti", properties: "Due mani, pesante", mastery: "Colpo di striscio", source: "SRD 5.2.1", pages: "103-104" },
  { id: "stocco", name: "Stocco", category: "daGuerra", kind: "mischia", finesse: true, weightKg: 1, costGp: 25, damage: "1d8 perforanti", properties: "Accurata", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
  { id: "tridente", name: "Tridente", category: "daGuerra", kind: "mischia", thrown: true, versatileDie: "1d10", weightKg: 2, costGp: 5, rangeMeters: [6, 18], damage: "1d8 perforanti", properties: "Lancio (6/18 m), versatile (1d10)", mastery: "Rovesciamento", source: "SRD 5.2.1", pages: "103-104" },
  { id: "arco-lungo", name: "Arco lungo", category: "daGuerra", kind: "distanza", weightKg: 1, costGp: 50, rangeMeters: [45, 180], damage: "1d8 perforanti", properties: "Due mani, munizioni (45/180 m; frecce), pesante", mastery: "Lentezza", source: "SRD 5.2.1", pages: "103-104" },
  { id: "balestra-a-mano", name: "Balestra a mano", category: "daGuerra", kind: "distanza", weightKg: 1.5, costGp: 75, rangeMeters: [9, 36], damage: "1d6 perforanti", properties: "Leggera, munizioni (9/36 m; quadrelli), ricarica", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
  { id: "balestra-pesante", name: "Balestra pesante", category: "daGuerra", kind: "distanza", weightKg: 9, costGp: 50, rangeMeters: [30, 120], damage: "1d10 perforanti", properties: "Due mani, munizioni (30/120 m; quadrelli), pesante, ricarica", mastery: "Spinta", source: "SRD 5.2.1", pages: "103-104" },
  { id: "cerbottana", name: "Cerbottana", category: "daGuerra", kind: "distanza", weightKg: 0.5, costGp: 10, rangeMeters: [7, 30], damage: "1 perforante", properties: "Munizioni (7/30 m; aghi), ricarica", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
  { id: "moschetto", name: "Moschetto", category: "daGuerra", kind: "distanza", weightKg: 5, costGp: 500, rangeMeters: [12, 36], damage: "1d12 perforanti", properties: "Due mani, munizioni (12/36 m; proiettili), ricarica", mastery: "Lentezza", source: "SRD 5.2.1", pages: "103-104" },
  { id: "pistola", name: "Pistola", category: "daGuerra", kind: "distanza", weightKg: 1.5, costGp: 250, rangeMeters: [9, 27], damage: "1d10 perforanti", properties: "Munizioni (9/27 m; proiettili), ricarica", mastery: "Vessazione", source: "SRD 5.2.1", pages: "103-104" },
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
