import regole from "./regole-srd-2024.json";

// Danni, proprietà e padronanze: tabella Armi, SRD 5.2.1 italiano, pp. 103–104.
type Weapon = { damage: string; properties: string; mastery: string };
const weapons: Record<string, Weapon> = {
  Ascia: { damage: "1d6 taglienti", properties: "Lancio (6/18 m), leggera", mastery: "Vessazione" },
  "Bastone ferrato": { damage: "1d6 contundenti", properties: "Versatile (1d8)", mastery: "Rovesciamento" },
  Falcetto: { damage: "1d4 taglienti", properties: "Leggera", mastery: "Graffio" },
  Giavellotto: { damage: "1d6 perforanti", properties: "Lancio (9/36 m)", mastery: "Lentezza" },
  Lancia: { damage: "1d6 perforanti", properties: "Lancio (6/18 m), versatile (1d8)", mastery: "Fiaccare" },
  "Martello leggero": { damage: "1d4 contundenti", properties: "Lancio (6/18 m), leggera", mastery: "Graffio" },
  Mazza: { damage: "1d6 contundenti", properties: "Nessuna", mastery: "Fiaccare" },
  Pugnale: { damage: "1d4 perforanti", properties: "Accurata, lancio (6/18 m), leggera", mastery: "Graffio" },
  "Randello pesante": { damage: "1d8 contundenti", properties: "Due mani", mastery: "Spinta" },
  Randello: { damage: "1d4 contundenti", properties: "Leggera", mastery: "Lentezza" },
  "Arco corto": { damage: "1d6 perforanti", properties: "Due mani, munizioni (24/96 m; frecce)", mastery: "Vessazione" },
  "Balestra leggera": { damage: "1d8 perforanti", properties: "Due mani, munizioni (24/96 m; quadrelli), ricarica", mastery: "Lentezza" },
  Dardo: { damage: "1d4 perforanti", properties: "Accurata, lancio (6/18 m)", mastery: "Vessazione" },
  Fionda: { damage: "1d4 contundenti", properties: "Munizioni (9/36 m; proiettili)", mastery: "Lentezza" },
  Alabarda: { damage: "1d10 taglienti", properties: "Due mani, pesante, portata", mastery: "Doppio fendente" },
  "Ascia bipenne": { damage: "1d12 taglienti", properties: "Due mani, pesante", mastery: "Doppio fendente" },
  "Ascia da battaglia": { damage: "1d8 taglienti", properties: "Versatile (1d10)", mastery: "Rovesciamento" },
  Falcione: { damage: "1d10 taglienti", properties: "Due mani, pesante, portata", mastery: "Colpo di striscio" },
  Frusta: { damage: "1d4 taglienti", properties: "Accurata, portata", mastery: "Lentezza" },
  "Lancia da cavaliere": { damage: "1d10 perforanti", properties: "Due mani (eccetto in sella), pesante, portata", mastery: "Rovesciamento" },
  Maglio: { damage: "2d6 contundenti", properties: "Due mani, pesante", mastery: "Rovesciamento" },
  "Martello da guerra": { damage: "1d8 contundenti", properties: "Versatile (1d10)", mastery: "Spinta" },
  "Mazza chiodata": { damage: "1d8 perforanti", properties: "Nessuna", mastery: "Fiaccare" },
  Mazzafrusto: { damage: "1d8 contundenti", properties: "Nessuna", mastery: "Fiaccare" },
  Picca: { damage: "1d10 perforanti", properties: "Due mani, pesante, portata", mastery: "Spinta" },
  "Piccone da guerra": { damage: "1d8 perforanti", properties: "Versatile (1d10)", mastery: "Fiaccare" },
  Scimitarra: { damage: "1d6 taglienti", properties: "Accurata, leggera", mastery: "Graffio" },
  "Spada corta": { damage: "1d6 perforanti", properties: "Accurata, leggera", mastery: "Vessazione" },
  "Spada lunga": { damage: "1d8 taglienti", properties: "Versatile (1d10)", mastery: "Fiaccare" },
  Spadone: { damage: "2d6 taglienti", properties: "Due mani, pesante", mastery: "Colpo di striscio" },
  Stocco: { damage: "1d8 perforanti", properties: "Accurata", mastery: "Vessazione" },
  Tridente: { damage: "1d8 perforanti", properties: "Lancio (6/18 m), versatile (1d10)", mastery: "Rovesciamento" },
  "Arco lungo": { damage: "1d8 perforanti", properties: "Due mani, munizioni (45/180 m; frecce), pesante", mastery: "Lentezza" },
  "Balestra a mano": { damage: "1d6 perforanti", properties: "Leggera, munizioni (9/36 m; quadrelli), ricarica", mastery: "Vessazione" },
  "Balestra pesante": { damage: "1d10 perforanti", properties: "Due mani, munizioni (30/120 m; quadrelli), pesante, ricarica", mastery: "Spinta" },
  Cerbottana: { damage: "1 perforante", properties: "Munizioni (7/30 m; aghi), ricarica", mastery: "Vessazione" },
  Moschetto: { damage: "1d12 perforanti", properties: "Due mani, munizioni (12/36 m; proiettili), ricarica", mastery: "Lentezza" },
  Pistola: { damage: "1d10 perforanti", properties: "Munizioni (9/27 m; proiettili), ricarica", mastery: "Vessazione" },
};

export function weaponDetails(name: string): string | null {
  if (name === "Armi semplici") return `Comprende: ${regole.armi.semplici.join(", ")}.`;
  if (name === "Armi da guerra") return `Comprende: ${regole.armi.daGuerra.join(", ")}.`;
  const weapon = weapons[name];
  if (!weapon) return null;
  const simpleIndex = regole.armi.semplici.findIndex((item) => item === name);
  const martialIndex = regole.armi.daGuerra.findIndex((item) => item === name);
  const simple = simpleIndex >= 0;
  const ranged = simple ? simpleIndex >= 10 : martialIndex >= 18;
  return `${simple ? "Arma semplice" : "Arma da guerra"} ${ranged ? "a distanza" : "da mischia"}. Danni: ${weapon.damage}. Proprietà: ${weapon.properties}. Padronanza: ${weapon.mastery} (solo se il personaggio la possiede).`;
}
