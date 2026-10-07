import type { Sheet } from "./sheet";

export type ReminderPart = string | { spell: string };
export type OperationalReminder = { parts: readonly ReminderPart[] };

const note = (text: string): OperationalReminder => ({ parts: [text] });

// Solo effetti utili durante la sessione che la scheda non espone già come valore o scelta.
// Manuale del Giocatore 2024: Druido pp. 80-81, specie pp. 189-196, Iniziato alla magia p. 201.
const reminders: Record<string, OperationalReminder> = {
  "aumento dei punteggi di caratteristica": note("Ottieni il talento Aumento dei punteggi di caratteristica oppure un altro talento di cui soddisfi i prerequisiti."),
  "nemico prescelto": note("Marchio del cacciatore è sempre preparato. Puoi lanciarlo senza slot per gli usi indicati dal ranger; recuperi gli usi dopo un riposo lungo."),
  "esploratore esperto": note("Conosci due lingue a scelta e ottieni Maestria in un'abilità in cui sei competente."),
  "stile di combattimento": note("Ottieni un talento Stile di combattimento a scelta; il suo effetto è indicato nella sezione Talenti."),
  intraprendente: note("Ottieni Ispirazione Eroica dopo ogni riposo lungo."),
  "pluriabilità": note("Ottieni competenza in un'abilità a scelta."),
  versatile: note("Ottieni un talento delle origini a scelta."),
  guaritore: note("Con una borsa del guaritore, come azione di Utilizzo curi una creatura entro 1,5 m: spende un Dado Vita e recupera il risultato più il tuo bonus di competenza. Puoi ritirare gli 1 nei dadi di guarigione, usando il nuovo risultato."),
  tiro: note("Ottieni +2 ai tiri per colpire con le armi a distanza."),
  druidico: note("Puoi lasciare messaggi nascosti in Druidico: chi conosce la lingua li individua automaticamente."),
  "compagno selvatico": { parts: [
    "Come azione di Magia, lancia ", { spell: "Trova famiglio" },
    " spendendo uno slot incantesimo o un uso di Forma Selvatica, senza componenti materiali. Il famiglio è un folletto e svanisce dopo un riposo lungo.",
  ] },
  "forma selvatica": note("Assumi o abbandoni una forma come azione bonus; dura metà del livello da druido in ore. Ottieni PF temporanei pari al livello da druido. Non puoi lanciare incantesimi, ma mantieni la concentrazione. Recuperi un uso dopo un riposo breve e tutti dopo un riposo lungo; puoi cambiare una forma conosciuta dopo un riposo lungo."),
  "retaggio fatato": note("Hai vantaggio ai tiri salvezza per evitare o terminare la condizione affascinato su di te."),
  trance: note("Completi un riposo lungo in 4 ore di trance, restando cosciente; la magia non può farti dormire."),
  "lignaggio elfo alto": note("Dopo ogni riposo lungo puoi sostituire il trucchetto del lignaggio con un altro trucchetto da mago."),
  "iniziato alla magia": note("Puoi lanciare l’incantesimo scelto una volta senza slot per riposo lungo, oppure usando uno slot. Quando sali di livello puoi sostituire un incantesimo scelto con uno dello stesso livello e della stessa lista."),
  "lavoro manuale": note("Ottieni competenza in tre strumenti da artigiano. Gli oggetti non magici costano il 20% in meno. Dopo un riposo lungo puoi fabbricare un oggetto della tabella Fabbricazione rapida con gli strumenti adatti; dura fino al prossimo riposo lungo."),
  "astuzia gnomesca": note("Hai vantaggio ai tiri salvezza su Intelligenza, Saggezza e Carisma."),
  "agilità halfling": note("Puoi attraversare lo spazio di una creatura più grande di te, senza fermarti lì."),
  coraggioso: note("Hai vantaggio ai tiri salvezza per evitare o terminare la condizione spaventato su di te."),
  fortuna: note("Quando ottieni 1 in una prova con d20, puoi ritirare il dado; devi usare il nuovo risultato."),
  "furtività innata": note("Puoi Nasconderti anche se sei oscurato solo da una creatura più grande di te di almeno una taglia."),
  "esperto minatore": note("Come azione bonus ottieni percezione tellurica entro 18 metri per 10 minuti, se sei su una superficie di pietra o la tocchi. Usi pari al bonus di competenza; si recuperano dopo un riposo lungo."),
  "resilienza nanica": note("Hai resistenza ai danni da veleno e vantaggio ai tiri salvezza per evitare o terminare la condizione avvelenato."),
  "scarica di adrenalina": note("Puoi usare Scatto come azione bonus e ottenere PF temporanei pari al bonus di competenza. Usi pari al bonus di competenza; si recuperano dopo un riposo breve o lungo."),
  "resistenza implacabile": note("Se scendi a 0 PF senza morire sul colpo, puoi restare a 1 PF. Si recupera dopo un riposo lungo."),
};

const darkvisionMeters: Record<string, number> = {
  Elfo: 18,
  Gnomo: 18,
  Nano: 36,
  Orco: 36,
  Tiefling: 18,
};

export function operationalReminder(name: string, sheet: Sheet): OperationalReminder | null {
  const key = name.toLocaleLowerCase("it");
  if (key === "nemico prescelto") {
    const resource = (sheet.risorse ?? []).find((item) => item.fonte.toLocaleLowerCase("it").includes("nemico prescelto") && item.nome.toLocaleLowerCase("it").includes("marchio del cacciatore"));
    return resource ? note(`Marchio del cacciatore è sempre preparato. Puoi lanciarlo ${resource.massimo} volte senza slot; recuperi gli usi dopo un riposo lungo.`) : reminders[key];
  }
  if (key === "incantesimi" && sheet.classe === "Ranger") {
    return note("Prepari incantesimi della lista da ranger e usi gli slot per lanciarli. Recuperi gli slot spesi dopo un riposo lungo.");
  }
  if (key === "padronanza d'armi" && sheet.classe === "Ranger") {
    return note("Usi le proprietà di padronanza di due tipi di armi scelte in cui hai competenza. Puoi cambiare un tipo scelto dopo un riposo lungo.");
  }
  if (key === "ordine primordiale") {
    return sheet.privilegi.some((item) => item.titolo.toLocaleLowerCase("it") === key && item.scelte.includes("Mago"))
      ? note("Alle prove di Intelligenza (Arcano o Natura) aggiungi il modificatore di Saggezza, minimo +1.")
      : null;
  }
  if (key === "scurovisione") {
    const meters = darkvisionMeters[sheet.specie];
    return meters ? note(`Vedi nell’oscurità entro ${meters} metri.`) : null;
  }
  return reminders[key] ?? null;
}
