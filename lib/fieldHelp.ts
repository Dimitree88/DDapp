export type FieldHelp = {
  meaning: string;
  effect: string;
  edit: string;
  lockedEdit?: string;
  rule?: boolean;
};

const doubleTap = "Doppio tocco sul valore per modificarlo; la modifica viene salvata automaticamente.";
const choice = "Doppio tocco sul valore per scegliere un'opzione; la modifica viene salvata automaticamente.";
const originLock = "La scelta iniziale è bloccata. Usa Reincarnazione per Specie, Lignaggio e Taglia base, oppure Correzione concordata con il DM.";
const correctionLock = "La scelta acquisita è bloccata. Usa Correzione concordata con il DM per cambiarla.";

export const fieldHelp: Record<string, FieldHelp> = {
  "Nome personaggio": { meaning: "Nome con cui il personaggio è identificato nell'app.", effect: "Compare nell'elenco dei personaggi, nella scheda e nei PDF.", edit: "Non è modificabile dalla scheda; chiedi una correzione manuale del personaggio." },
  Livello: { meaning: "Livello totale del personaggio.", effect: "Aggiorna il bonus competenza e tutti i calcoli che lo usano, inclusa l'Iniziativa con Allerta.", edit: choice, rule: true },
  Classe: { meaning: "Classe iniziale del personaggio.", effect: "Determina le opzioni di Sottoclasse mostrate; le capacità di classe si registrano separatamente.", edit: choice, lockedEdit: correctionLock, rule: true },
  Sottoclasse: { meaning: "Specializzazione della Classe, scelta quando le regole la concedono.", effect: "La scheda mostra il nome; privilegi e capacità si registrano separatamente.", edit: choice, lockedEdit: correctionLock, rule: true },
  "Punti Ferita": { meaning: "Punti ferita attuali.", effect: "Registra danni e guarigioni; non cambia i Punti Ferita Massimi.", edit: doubleTap, rule: true },
  "Punti Ferita Massimi": { meaning: "Limite ordinario dei punti ferita del personaggio.", effect: "La scheda mostra il massimo; l'app non lo ricalcola automaticamente quando sali di livello.", edit: doubleTap, rule: true },
  "Classe Armatura": { meaning: "Valore usato per stabilire se un attacco colpisce.", effect: "La scheda mostra questo numero; armatura, scudo e altri effetti non sono sommati automaticamente.", edit: doubleTap, rule: true },
  Scudo: { meaning: "Indica se il personaggio usa uno scudo.", effect: "La spunta compare nella scheda; non modifica automaticamente la Classe Armatura.", edit: choice, rule: true },
  "Dadi Vita": { meaning: "Dadi Vita del personaggio, da usare per riposo e avanzamento.", effect: "La scheda conserva il testo inserito; il valore non viene calcolato dalla Classe.", edit: doubleTap, rule: true },
  "Punti Esperienza": { meaning: "Esperienza accumulata dal personaggio.", effect: "Il valore è mostrato nella scheda; il Livello non cambia automaticamente.", edit: doubleTap, rule: true },
  "Ispirazione Eroica": { meaning: "Risorsa che permette di ritirare un dado secondo le regole 2024.", effect: "La spunta indica se la risorsa è disponibile; non cambia altri calcoli.", edit: choice, rule: true },
  "Velocità": { meaning: "Velocità di movimento registrata in metri.", effect: "La scheda mostra il valore inserito; tratti ed effetti non sono applicati automaticamente.", edit: doubleTap, rule: true },
  Allineamento: { meaning: "Descrizione generale dell'orientamento morale del personaggio.", effect: "Cambia solo la voce mostrata nella scheda e nei PDF.", edit: choice, rule: true },
  "Taglia base": { meaning: "Taglia ordinaria determinata dalla Specie; alcune Specie consentono una scelta tra Piccola e Media.", effect: "Le opzioni sono limitate dalla Specie. Effetti temporanei non cambiano questo campo.", edit: choice, lockedEdit: originLock, rule: true },
  Specie: { meaning: "Specie del personaggio e origine dei suoi tratti.", effect: "Cambiarla aggiorna la Taglia base proposta e azzera il Lignaggio; i tratti vanno aggiornati manualmente.", edit: choice, lockedEdit: originLock, rule: true },
  Background: { meaning: "Origine e occupazione che hanno formato il personaggio prima dell'avventura.", effect: "Il campo cambia il nome mostrato; aumenti di caratteristica, competenze e talento d'origine si registrano separatamente.", edit: choice, lockedEdit: correctionLock, rule: true },
  Lignaggio: { meaning: "Variante prevista da alcune Specie, come Elfo, Gnomo e Tiefling.", effect: "La scheda mostra la scelta; gli incantesimi e i tratti concessi si registrano separatamente.", edit: choice, lockedEdit: originLock, rule: true },
  Lingue: { meaning: "Lingue conosciute dal personaggio.", effect: "Aggiungere una lingua aggiorna la scheda e il PDF; non cambia i bonus numerici.", edit: "Usa Aggiungi lingua; doppio tocco su una voce vuota per sceglierla. Una lingua acquisita resta bloccata.", lockedEdit: correctionLock, rule: true },
  "Note lingue": { meaning: "Dettagli personali sulle lingue conosciute.", effect: "Cambia solo il testo nella scheda.", edit: doubleTap },
  Valore: { meaning: "Punteggio di una delle sei caratteristiche.", effect: "Aggiorna il modificatore, i tiri salvezza, le abilità collegate e gli altri calcoli derivati.", edit: doubleTap, rule: true },
  "Valore.FOR": { meaning: "Forza: potenza fisica e capacità di esercitare forza.", effect: "Aggiorna il modificatore di Forza, il suo tiro salvezza e Atletica.", edit: doubleTap, rule: true },
  "Valore.DES": { meaning: "Destrezza: agilità, riflessi e precisione.", effect: "Aggiorna il modificatore di Destrezza, il suo tiro salvezza, le abilità collegate e l'Iniziativa.", edit: doubleTap, rule: true },
  "Valore.COS": { meaning: "Costituzione: salute e resistenza fisica.", effect: "Aggiorna il modificatore e il tiro salvezza di Costituzione; i Punti Ferita Massimi non sono ricalcolati automaticamente.", edit: doubleTap, rule: true },
  "Valore.INT": { meaning: "Intelligenza: memoria e ragionamento.", effect: "Aggiorna il modificatore di Intelligenza, il suo tiro salvezza e le abilità collegate.", edit: doubleTap, rule: true },
  "Valore.SAG": { meaning: "Saggezza: consapevolezza e intuizione.", effect: "Aggiorna il modificatore di Saggezza, il suo tiro salvezza, le abilità collegate e la Percezione Passiva.", edit: doubleTap, rule: true },
  "Valore.CAR": { meaning: "Carisma: presenza e capacità di influenzare gli altri.", effect: "Aggiorna il modificatore di Carisma, il suo tiro salvezza e le abilità collegate.", edit: doubleTap, rule: true },
  "Tiro Salvezza": { meaning: "Indica la competenza nel tiro salvezza della caratteristica.", effect: "Se attiva, il bonus competenza viene aggiunto al tiro salvezza.", edit: "Doppio tocco sulla spunta per aggiungere la competenza.", lockedEdit: correctionLock, rule: true },
  Maestria: { meaning: "Raddoppia il bonus competenza per l'abilità indicata.", effect: "Aggiorna il bonus dell'abilità e, per Percezione, anche la Percezione Passiva.", edit: "Doppio tocco sulla spunta; serve prima la competenza.", lockedEdit: correctionLock, rule: true },
  "Competenze armi": { meaning: "Armi o categorie di armi in cui il personaggio è competente.", effect: "La lista è mostrata nella scheda; i bonus delle singole armi non sono ricalcolati automaticamente.", edit: "Aggiungi una nuova competenza; quelle acquisite non si rimuovono senza correzione del DM.", lockedEdit: correctionLock, rule: true },
  Armi: { meaning: "Armi possedute o usate dal personaggio.", effect: "Aggiungere o rimuovere una voce cambia l'elenco nella scheda e nel PDF.", edit: "Usa Aggiungi arma, apri la voce e modifica i suoi campi con doppio tocco." },
  "Quantità arma": { meaning: "Numero di esemplari dell'arma posseduti.", effect: "Aggiorna la quantità mostrata e l'esportazione PDF.", edit: doubleTap },
  "Nome arma": { meaning: "Tipo di arma registrata.", effect: "Cambia il nome nella scheda; bonus e danni non vengono calcolati dal tipo.", edit: choice, rule: true },
  "Bonus att./CD": { meaning: "Bonus al tiro per colpire o CD associata all'arma, se pertinente.", effect: "Cambia solo il valore scritto nella voce: l'app non applica automaticamente caratteristica e competenza.", edit: doubleTap },
  "Dettaglio arma": { meaning: "Note personali sull'arma, come proprietà, danni o effetti.", effect: "Cambia il testo mostrato nella scheda.", edit: doubleTap },
  "Competenze armatura": { meaning: "Categorie di armatura e scudi in cui il personaggio è competente.", effect: "Le spunte registrano le competenze, ma non modificano automaticamente la Classe Armatura.", edit: "Doppio tocco per acquisire una competenza; quelle già acquisite richiedono una correzione concordata con il DM.", lockedEdit: correctionLock, rule: true },
  Oggetti: { meaning: "Equipaggiamento posseduto dal personaggio.", effect: "Le voci cambiano l'elenco nella scheda; peso e benefici non sono calcolati automaticamente.", edit: "Usa Aggiungi oggetto; apri la voce per modificarla o rimuoverla." },
  Oggetto: { meaning: "Nome di un oggetto posseduto.", effect: "Cambia la voce nell'equipaggiamento.", edit: doubleTap },
  "Dettaglio oggetto": { meaning: "Dettaglio personale di un oggetto.", effect: "Cambia solo la descrizione mostrata.", edit: doubleTap },
  Privilegi: { meaning: "Privilegi e capacità ottenuti da classe, specie o altre fonti.", effect: "Le voci documentano le capacità; gli effetti numerici non sono applicati automaticamente salvo quelli implementati altrove.", edit: "Usa Aggiungi privilegio e modifica titolo e scelte con doppio tocco.", rule: true },
  Titolo: { meaning: "Nome del privilegio o della capacità.", effect: "Cambia il titolo mostrato nella scheda.", edit: doubleTap },
  "Scelte privilegio": { meaning: "Scelte e dettagli personali legati a un privilegio.", effect: "Il testo non cambia automaticamente altri valori della scheda.", edit: doubleTap },
  Talenti: { meaning: "Talenti acquisiti dal personaggio.", effect: "Il talento Allerta aumenta automaticamente l'Iniziativa; gli altri effetti vanno registrati dove pertinenti.", edit: "Usa Aggiungi talento. Un nome acquisito si cambia o rimuove solo con correzione concordata con il DM.", lockedEdit: correctionLock, rule: true },
  "Nome talento": { meaning: "Talento selezionato per il personaggio.", effect: "Allerta aggiunge il bonus competenza all'Iniziativa; gli altri effetti non sono tutti automatici.", edit: choice, lockedEdit: correctionLock, rule: true },
  "Scelte talento": { meaning: "Scelte personali richieste o concesse dal talento.", effect: "Il testo le documenta; non cambia automaticamente altri campi.", edit: doubleTap, rule: true },
  Incantesimi: { meaning: "Incantesimi registrati nella scheda.", effect: "La lista compare nella scheda e nel PDF; disponibilità, preparazione e slot non sono verificati automaticamente.", edit: "Usa Aggiungi incantesimo; apri una voce per sceglierne il nome o rimuoverla.", rule: true },
  "Nome incantesimo": { meaning: "Nome dell'incantesimo scelto dal catalogo.", effect: "Cambia la voce nella lista; non modifica automaticamente slot o risorse.", edit: choice, rule: true },
  Monete: { meaning: "Quantità possedute per ciascun tipo di moneta.", effect: "Cambiare una quantità aggiorna la scheda e il PDF; non converte automaticamente tra monete.", edit: doubleTap, rule: true },
};

export function helpFor(id: string): FieldHelp {
  return fieldHelp[id] ?? {
    meaning: `Valore registrato per ${id}.`,
    effect: "La modifica aggiorna la scheda e, quando previsto, il PDF.",
    edit: doubleTap,
  };
}
