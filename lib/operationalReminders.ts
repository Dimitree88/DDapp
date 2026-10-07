import type { Sheet } from "./sheet";

export type ReminderPart = string | { spell: string };
export type OperationalReminder = { parts: readonly ReminderPart[] };

const note = (text: string): OperationalReminder => ({ parts: [text] });

// Solo effetti utili durante la sessione che la scheda non espone già come valore o scelta.
// Manuale del Giocatore 2024: Druido pp. 80-81, specie pp. 189-196, Iniziato alla magia p. 201.
const reminders: Record<string, OperationalReminder> = {
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
  "lavoro manuale": note("Quando acquisti un oggetto non magico, ottieni il 20% di sconto."),
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
