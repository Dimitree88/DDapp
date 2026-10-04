// Descrizioni brevi per gli oggetti già presenti nelle schede; le note personali
// restano separate e sono mostrate anche per gli oggetti senza voce di catalogo.
const equipment: Record<string, { meaning: string; page?: number }> = {
  "Armatura di cuoio borchiato": { meaning: "Armatura leggera: CA 12 + modificatore di Destrezza.", page: 104 },
  "Armatura di cuoio": { meaning: "Armatura leggera: CA 11 + modificatore di Destrezza.", page: 104 },
  "Cotta di maglia": { meaning: "Armatura pesante: CA 16. Richiede Forza 13 per evitare una riduzione della velocità.", page: 104 },
  "Scudo": { meaning: "Se impugnato da un personaggio competente negli scudi, aumenta la Classe Armatura di 2.", page: 104 },
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
  const known = equipment[base];
  const notes = personal.trim();
  if (!known && !notes) return null;
  return {
    meaning: [known?.meaning, notes && `Dettaglio personale: ${notes}`].filter(Boolean).join("\n\n"),
    page: known?.page,
    rule: Boolean(known?.page),
  };
}
