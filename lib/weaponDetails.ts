import regole from "./regole-srd-2024.json";

const simple = regole.armi.semplici;
const martial = regole.armi.daGuerra;

export function weaponDetails(name: string): string | null {
  if (name === "Armi semplici") return `Comprende: ${simple.join(", ")}.`;
  if (name === "Armi da guerra") return `Comprende: ${martial.join(", ")}.`;

  const simpleIndex = simple.findIndex((weapon) => weapon === name);
  if (simpleIndex >= 0) return `Arma semplice ${simpleIndex < 10 ? "da mischia" : "a distanza"}.`;

  const martialIndex = martial.findIndex((weapon) => weapon === name);
  if (martialIndex >= 0) return `Arma da guerra ${martialIndex < 18 ? "da mischia" : "a distanza"}.`;

  return null;
}
