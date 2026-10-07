import { canonicalSpellName } from "./spells";

// Danno base verificato direttamente in docs/regole/Manuale Del Giocatore - 2024.pdf.
// Il numero è la pagina stampata. Si omettono gli incantesimi senza un danno
// iniziale univoco o per cui il testo estratto non consente una nota affidabile.
const damage: Record<string, [note: string, page: number]> = {
  "Arma spirituale": ["1d8+mod forza", 244],
  "Colpo infuocato": ["5d6 fuoco + 5d6 radiosi", 254],
  "Colpo intrappolante": ["1d6 perforanti/turno", 254],
  "Coltello di ghiaccio": ["1d10 perforanti + 2d6 freddo", 254],
  "Cono di freddo": ["8d8 freddo", 256],
  "Dardo di fuoco": ["1d10 fuoco", 263],
  "Dardo incantato": ["1d4+1 forza per dardo", 263],
  "Dardo stregato": ["2d12 fulmine", 263],
  "Deflagrazione occulta": ["1d10 forza per raggio", 263],
  "Evoca pioggia di armi": ["8d8 forza", 271],
  "Evoca raffica": ["5d8 forza", 271],
  "Frantumare": ["3d8 tuono", 276],
  "Freccia acida di Melf": ["4d4 acido + 2d4 dopo", 276],
  "Freccia folgorante": ["4d8 fulmine", 276],
  "Fulmine": ["8d6 fulmine", 276],
  "Intimorire infernale": ["2d10 fuoco", 285],
  "Invocare il fulmine": ["3d10 fulmine", 286],
  "Lama infuocata": ["3d6+mod fuoco", 287],
  "Mani brucianti": ["3d6 fuoco", 290],
  "Marchio del cacciatore": ["+1d6 forza per colpo", 291],
  "Muro di fuoco": ["5d8 fuoco", 294],
  "Onda distruttiva": ["5d6 tuono + 5d6 rad./necr.", 297],
  "Onda tonante": ["2d8 tuono", 297],
  "Palla di fuoco": ["8d6 fuoco", 298],
  "Produrre fiamma": ["1d8 fuoco", 304],
  "Punizione esiliante": ["+5d10 forza", 307],
  "Punizione incandescente": ["+1d6 fuoco", 307],
  "Punizione tonante": ["+2d6 tuono", 307],
  "Raggio di gelo": ["1d8 freddo", 308],
  "Raggio di infermità": ["2d8 veleno", 308],
  "Raggio rovente": ["2d6 fuoco per raggio", 308],
  "Riscaldare il metallo": ["2d8 fuoco", 321],
  "Rombo di tuono": ["1d6 tuono", 322],
  "Scudo di fuoco": ["2d8 fuoco/freddo", 326],
  "Segugio fedele di Mordenkainen": ["4d8 forza", 327],
  "Sfera al vetriolo": ["10d4 acido + 5d4 dopo", 328],
  "Sfera infuocata": ["2d6 fuoco", 329],
  "Spada di Mordenkainen": ["4d12+mod forza", 331],
  "Spruzzo velenoso": ["1d12 veleno", 332],
  "Stretta folgorante": ["1d8 fulmine", 333],
  "Tempesta di fuoco": ["7d10 fuoco", 335],
  "Tempesta di ghiaccio": ["2d10 contundenti + 4d6 freddo", 335],
};

export function spellDamageNote(name: string): string | undefined {
  return damage[canonicalSpellName(name)]?.[0];
}
