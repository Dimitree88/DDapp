import { armorCatalog } from "./armorCatalog";
import { gearByName } from "./gearCatalog";

// Descrizioni brevi per gli oggetti già presenti nelle schede; le note personali
// restano separate e sono mostrate anche per gli oggetti senza voce di catalogo.
const equipment: Record<string, { meaning: string; page?: number }> = {
  "Focus druidico (rametto di vischio)": { meaning: "Focus druidico usabile come componente materiale per gli incantesimi che lo consentono." },
  "Borsa da erborista": { meaning: "Strumento usato per identificare piante e preparare rimedi; richiede una competenza separata per aggiungere il bonus alle prove." },
  "Pozione di guarigione": { meaning: "Se bevuta, fa recuperare 2d4 + 2 punti ferita.", page: 276 },
  "Torcia": { meaning: "Arde per 1 ora: luce intensa entro 6 metri e luce fioca per altri 6 metri.", page: 113 },
  "Torce": { meaning: "Ogni torcia arde per 1 ora: luce intensa entro 6 metri e luce fioca per altri 6 metri.", page: 113 },
  "Frecce": { meaning: "Munizioni per archi; ogni tiro consuma una freccia." },
  "Frecce d'argento": { meaning: "Munizioni per archi realizzate in argento." },
  "Razioni giornaliere": { meaning: "Provviste alimentari trasportabili per il viaggio." },
  "Otre": { meaning: "Contenitore portatile per l'acqua." },
  "Corda": { meaning: "Corda utilizzabile per legare, calarsi o arrampicarsi." },
  "Acciarino e pietra focaia": { meaning: "Attrezzi per accendere un fuoco." },
  "Lampada a olio": { meaning: "Lampada alimentata a olio per illuminare l'ambiente." },
  "Giaciglio": { meaning: "Letto portatile per riposare durante il viaggio." },
  "Abiti da viaggiatore": { meaning: "Indumenti adatti al viaggio." },
};

export function equipmentDetails(name: string, personal = ""): { meaning: string; page?: number; rule?: boolean } | null {
  const base = name.trim().replace(/\s+x\d+$/i, "");
  const armor = armorCatalog.find((item) => item.name === base);
  const armorMeaning = armor ? `${armor.category === "scudi" ? "Se impugnato con competenza, lo scudo aumenta la CA di 2." : `${armor.category === "leggere" ? "Armatura leggera" : armor.category === "medie" ? "Armatura media" : "Armatura pesante"}: CA ${armor.baseAc}${armor.dexterity === "full" ? " + modificatore di Destrezza" : armor.dexterity === "max2" ? " + modificatore di Destrezza (massimo +2)" : ""}.${armor.strength ? ` Richiede Forza ${armor.strength} per non ridurre la velocità di 3 m.` : ""}${armor.stealthDisadvantage ? " Svantaggio a Furtività." : ""}`} Peso ${armor.weightKg} kg; costo ${armor.costGp} mo.` : "";
  const gear = gearByName(base);
  const known = armor ? { meaning: armorMeaning, page: 103 } : gear ? { meaning: [equipment[base]?.meaning, `Peso ${gear.weightKg === undefined ? "non indicato" : `${gear.weightKg} kg${gear.priceQuantity ? " per unità" : ""}`}; costo ${gear.costGp} mo${gear.priceQuantity ? ` per ${gear.priceQuantity}` : ""}.`].filter(Boolean).join(" "), page: gear.sourcePage ?? (gear.priceQuantity ? 110 : 107) } : equipment[base];
  const notes = personal.trim();
  if (!known && !notes) return null;
  return {
    meaning: [known?.meaning, notes && `Dettaglio personale: ${notes}`].filter(Boolean).join("\n\n"),
    page: known?.page,
    rule: Boolean(known?.page),
  };
}
