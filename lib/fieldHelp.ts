import { etichettaManuale } from "./manuale-2024/index";

export type FieldHelp = { meaning: string; effect?: string; rule?: boolean; page?: number | string };

export const fieldHelp: Record<string, FieldHelp> = {
  "Nome personaggio": { meaning: "Nome con cui il personaggio è identificato nell'app." },
  Livello: { meaning: "Livello totale del personaggio.", effect: "Aggiorna il bonus competenza e tutti i calcoli che lo usano, inclusa l'Iniziativa con Allerta.", rule: true },
  Classe: { meaning: "Classe iniziale del personaggio.", effect: "Determina le opzioni di sottoclasse e i privilegi acquisiti mostrati in base al livello.", rule: true, page: 33 },
  Sottoclasse: { meaning: "Specializzazione della Classe, scelta quando le regole la concedono.", rule: true },
  "Punti Ferita": { meaning: "Punti ferita attuali.", rule: true },
  "Punti Ferita Massimi": { meaning: "Limite ordinario dei punti ferita del personaggio.", rule: true },
  "Classe Armatura": { meaning: "Valore che un tiro per colpire deve raggiungere. La scheda lo calcola da Destrezza, armatura indossata e scudo impugnato.", rule: true },
  Scudo: { meaning: "Indica se il personaggio impugna uno scudo. Con la competenza negli scudi, aggiunge 2 alla Classe Armatura calcolata; una variante magica impugnata aggiunge il suo bonus.", rule: true },
  "Dadi Vita": { meaning: "Dadi Vita del personaggio, da usare per riposo e avanzamento.", rule: true },
  "Punti Esperienza": { meaning: "Esperienza accumulata dal personaggio.", rule: true },
  "Ispirazione Eroica": { meaning: "Risorsa che permette di ritirare un dado secondo le regole 2024.", rule: true },
  "Velocità": { meaning: "Velocità di movimento registrata in metri.", rule: true },
  Allineamento: { meaning: "Descrizione generale dell'orientamento morale del personaggio.", rule: true },
  "Taglia base": { meaning: "Taglia ordinaria determinata dalla Specie; alcune Specie consentono una scelta tra Piccola e Media.", rule: true, page: 25 },
  Specie: { meaning: "Specie del personaggio e origine dei suoi tratti. È una scelta iniziale fissa.", rule: true },
  Background: { meaning: "Origine e occupazione che hanno formato il personaggio prima dell'avventura.", rule: true },
  Lignaggio: { meaning: "Variante prevista da alcune Specie, come Elfo, Gnomo e Tiefling.", rule: true },
  Lingue: { meaning: "Lingue che il personaggio conosce: può usarle per comunicare, leggere e scrivere.", rule: true, page: 37 },
  "Note lingue": { meaning: "Dettagli personali sulle lingue conosciute." },
  Valore: { meaning: "Punteggio di una delle sei caratteristiche.", effect: "Aggiorna il modificatore, i tiri salvezza, le abilità collegate e gli altri calcoli derivati.", rule: true },
  "Valore.FOR": { meaning: "Forza: potenza fisica e capacità di esercitare forza.", effect: "Aggiorna il modificatore di Forza, il suo tiro salvezza e Atletica.", rule: true },
  "Valore.DES": { meaning: "Destrezza: agilità, riflessi e precisione.", effect: "Aggiorna il modificatore di Destrezza, il suo tiro salvezza, le abilità collegate e l'Iniziativa.", rule: true },
  "Valore.COS": { meaning: "Costituzione: salute e resistenza fisica.", effect: "Aggiorna il modificatore e il tiro salvezza di Costituzione; i Punti Ferita Massimi non sono ricalcolati automaticamente.", rule: true },
  "Valore.INT": { meaning: "Intelligenza: memoria e ragionamento.", effect: "Aggiorna il modificatore di Intelligenza, il suo tiro salvezza e le abilità collegate.", rule: true },
  "Valore.SAG": { meaning: "Saggezza: consapevolezza e intuizione.", effect: "Aggiorna il modificatore di Saggezza, il suo tiro salvezza, le abilità collegate e la Percezione Passiva.", rule: true },
  "Valore.CAR": { meaning: "Carisma: presenza e capacità di influenzare gli altri.", effect: "Aggiorna il modificatore di Carisma, il suo tiro salvezza e le abilità collegate.", rule: true },
  "Tiro Salvezza": { meaning: "Indica la competenza nel tiro salvezza della caratteristica.", effect: "Se attiva, il bonus competenza viene aggiunto al tiro salvezza.", rule: true },
  Maestria: { meaning: "Raddoppia il bonus competenza per l'abilità indicata.", effect: "Aggiorna il bonus dell'abilità e, per Percezione, anche la Percezione Passiva.", rule: true },
  "Competenze armi": { meaning: "Indicano le armi o categorie di armi che il personaggio sa usare: per i loro attacchi si aggiunge il bonus competenza al tiro per colpire. Provengono soprattutto dalla classe; altre capacità o scelte registrate nella scheda possono aggiungerne.", rule: true },
  "Competenze negli strumenti": { meaning: "Classe, background, talenti e altre capacità possono concedere competenza in uno strumento. Si aggiunge il bonus competenza alle prove che usano quello strumento; se si applica anche una competenza in un'abilità, la prova ha vantaggio. Tocca una competenza per vederne l'origine.", rule: true },
  Armi: { meaning: "Armi possedute o usate dal personaggio." },
  "Quantità arma": { meaning: "Numero di esemplari dell'arma posseduti." },
  "Nome arma": { meaning: "Tipo di arma registrata.", rule: true },
  "Bonus att./CD": { meaning: "Bonus al tiro per colpire o CD associata all'arma, se pertinente." },
  "Dettaglio arma": { meaning: "Note personali sull'arma, come proprietà, danni o effetti." },
  "Competenze armatura": { meaning: "Indicano le categorie di armatura e gli scudi che il personaggio sa usare senza le penalità previste per chi non è competente. Nell'app, la competenza negli scudi permette di aggiungere il loro +2 alla Classe Armatura calcolata. Provengono soprattutto dalla classe; altre capacità o fonti registrate nella scheda possono aggiungerne.", rule: true },
  "Padronanze scelte": { meaning: "Permettono di usare l'effetto speciale di padronanza delle armi scelte. La classe concede un certo numero di scelte, che può aumentare con il livello; la scheda propone le armi in cui il personaggio è competente. Tocca una padronanza per leggere il suo effetto.", rule: true },
  Oggetti: { meaning: "Equipaggiamento posseduto dal personaggio." },
  Oggetto: { meaning: "Nome di un oggetto posseduto." },
  "Dettaglio oggetto": { meaning: "Dettaglio personale di un oggetto." },
  Privilegi: { meaning: "Privilegi e capacità ottenuti da classe, specie o altre fonti.", rule: true },
  Titolo: { meaning: "Nome del privilegio o della capacità." },
  "Scelte privilegio": { meaning: "Scelte e dettagli personali legati a un privilegio." },
  Talenti: { meaning: "Talenti acquisiti dal personaggio.", effect: "Allerta aggiorna l'Iniziativa; Lavoro manuale e Musicista registrano le competenze negli strumenti scelte. Gli altri effetti vanno registrati dove pertinenti.", rule: true, page: 199 },
  "Nome talento": { meaning: "Talento selezionato per il personaggio.", effect: "L'app applica automaticamente solo gli effetti dei talenti che ha modellato esplicitamente.", rule: true, page: 199 },
  "Scelte talento": { meaning: "Scelte personali richieste o concesse dal talento.", rule: true },
  Incantesimi: { meaning: "Incantesimi registrati nella scheda.", rule: true },
  "Nome incantesimo": { meaning: "Nome dell'incantesimo scelto dal catalogo.", rule: true },
  Monete: { meaning: "Quantità possedute per ciascun tipo di moneta.", rule: true },
};

export function helpFor(id: string): FieldHelp | null {
  return fieldHelp[id] ?? null;
}

// Aiuto per una label della scheda. La descrizione, se disponibile, è quella
// estratta dal Manuale del Giocatore 2024 per l'etichetta corrispondente
// (per id o per nome mostrato); resta il campo `effect` interno, che descrive
// il comportamento dell'app e non è contenuto del manuale.
export function labelHelp(id: string, title?: string): FieldHelp | null {
  const hard = helpFor(id);
  const etichetta = etichettaManuale(id) ?? (title ? etichettaManuale(title) : null);
  if (etichetta?.descrizione) {
    return {
      meaning: etichetta.descrizione,
      effect: hard?.effect,
      rule: true,
      page: etichetta.voce.pagina,
    };
  }
  return hard;
}
