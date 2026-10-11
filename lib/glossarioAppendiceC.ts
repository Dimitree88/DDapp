import type { HomeGlossaryEntry } from "./homeGlossary";

// Voci mancanti verificate nell'Appendice C del Manuale del Giocatore 2024.
// Le descrizioni riassumono le definizioni del testo, senza sostituirne le regole.
export const glossarioAppendiceC: HomeGlossaryEntry[] = [
  {
    id: "appendice-c:abbreviazioni",
    name: "Abbreviazioni",
    category: "Glossario delle regole",
    description: "Il glossario elenca abbreviazioni usate nel regolamento, tra cui bonus di competenza (BC), Classe Armatura (CA), Classe Difficoltà (CD), punti ferita (PF), Dungeon Master (DM) e le sigle delle monete.",
    reference: "Manuale del Giocatore 2024, p. 360",
    searchNames: ["BC", "CA", "CD", "PF", "DM", "MO", "MA", "MP", "MR", "ME"],
  },
  {
    id: "appendice-c:afferrare",
    name: "Afferrare",
    category: "Glossario delle regole",
    description: "Una creatura può afferrarne un'altra con un colpo senz'armi o con un attacco speciale. Serve una mano libera, salvo capacità che consentono prese con altre parti del corpo; ogni parte del corpo può trattenere una creatura alla volta. Il bersaglio afferrato può liberarsi con un'azione e una prova di Forza (Atletica) o Destrezza (Acrobazia) contro la CD della presa. La presa termina anche se chi afferra è incapacitato o la distanza supera la portata; chi afferra può inoltre liberare il bersaglio senza spendere un'azione.",
    reference: "Manuale del Giocatore 2024, pp. 360–361",
    searchNames: ["Afferrare una creatura", "Presa"],
  },
  {
    id: "appendice-c:al-giorno",
    name: "Al giorno",
    category: "Glossario delle regole",
    description: "Se una regola consente un numero limitato di utilizzi al giorno, dopo averli esauriti occorre completare un riposo lungo prima di poter usare di nuovo quella capacità.",
    reference: "Manuale del Giocatore 2024, p. 361",
  },
  {
    id: "appendice-c:alleato",
    name: "Alleato",
    category: "Glossario delle regole",
    description: "È alleata una creatura che appartiene al gruppo di avventurieri, è amica del personaggio, combatte al suo fianco o è indicata come alleata dalle regole o dal DM.",
    reference: "Manuale del Giocatore 2024, p. 361",
  },
  {
    id: "appendice-c:amichevole",
    name: "Amichevole",
    category: "Glossario delle regole",
    description: "Una creatura amichevole ha un'opinione positiva del personaggio. Il personaggio dispone di vantaggio alle prove di caratteristica effettuate per influenzarla.",
    reference: "Manuale del Giocatore 2024, p. 361",
    searchNames: ["Amichevole [Atteggiamento]", "Atteggiamento amichevole"],
  },
  {
    id: "appendice-c:area-di-effetto",
    name: "Area di effetto",
    category: "Glossario delle regole",
    description: "Incantesimi e privilegi possono specificare un'area di effetto, di norma a forma di cilindro, cubo, cono, emanazione, linea o sfera. Le regole della forma stabiliscono origine e area; una parte dell'area è esclusa se tutte le linee rette dall'origine sono bloccate da copertura totale. Se l'origine scelta non è visibile e un'ostruzione si interpone, l'origine si forma sul lato più vicino dell'ostruzione.",
    reference: "Manuale del Giocatore 2024, p. 361",
    searchNames: ["Aree di effetto", "Area d'effetto"],
  },
  {
    id: "appendice-c:arma",
    name: "Arma",
    category: "Glossario delle regole",
    description: "Un'arma è un oggetto appartenente alla categoria delle armi semplici o da guerra.",
    reference: "Manuale del Giocatore 2024, p. 361",
  },
  {
    id: "appendice-c:armi-improvvisate",
    name: "Armi improvvisate",
    category: "Glossario delle regole",
    description: "Un oggetto brandito alla buona può essere un'arma improvvisata. Anche un'arma usata in modo contrario alla sua funzione conta come improvvisata: per esempio, un'arma a distanza usata in mischia o un'arma da mischia senza proprietà da lancio scagliata. Non si aggiunge il bonus di competenza al tiro per colpire; se l'attacco colpisce, infligge 1d4 danni del tipo stabilito dal DM. La gittata è 6/18 metri. Se l'oggetto somiglia a un'arma semplice o da guerra, il DM può trattarlo come tale.",
    reference: "Manuale del Giocatore 2024, pp. 361–362",
    searchNames: ["Arma improvvisata", "Armi improvvisate"],
  },
  {
    id: "appendice-c:arrotondare-per-difetto",
    name: "Arrotondare per difetto",
    category: "Glossario delle regole",
    description: "Quando una divisione o moltiplicazione produce una frazione, si arrotonda per difetto anche se la frazione è pari o superiore alla metà, salvo che una regola specifichi di arrotondare per eccesso.",
    reference: "Manuale del Giocatore 2024, p. 362",
  },
  {
    id: "appendice-c:atteggiamento",
    name: "Atteggiamento",
    category: "Glossario delle regole",
    description: "Ogni mostro ha un atteggiamento iniziale verso il personaggio: amichevole, ostile o indifferente.",
    reference: "Manuale del Giocatore 2024, p. 362",
  },
  {
    id: "appendice-c:azione-bonus",
    name: "Azione bonus",
    category: "Glossario delle regole",
    description: "È un'azione speciale che il personaggio può effettuare nello stesso turno in cui compie un'azione. Si può effettuare al massimo un'azione bonus per turno, e solo quando una regola indica esplicitamente come ottenerla.",
    reference: "Manuale del Giocatore 2024, pp. 362–363",
  },
];
