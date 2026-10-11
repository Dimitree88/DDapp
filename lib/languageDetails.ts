import regole from "./manuale-2024-domains.json";

const normalizeLanguage = (name: string) => name.trim().toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const languages = new Set([...regole.lingue.standard, ...regole.lingue.rare].map(normalizeLanguage));

const details: Record<string, { meaning: string; page: number }> = {
  "comune": {
    meaning: "Lingua standard. Ogni personaggio giocante conosce il Comune. Le sue origini risalgono alla metropoli planare di Sigil, fulcro del multiverso. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "lingua dei segni comune": {
    meaning: "Lingua standard. Origine: Sigil. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "draconico": {
    meaning: "Lingua standard. Origine: draghi. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "nanico": {
    meaning: "Lingua standard. Origine: nani. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "elfico": {
    meaning: "Lingua standard. Origine: elfi. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "gigante": {
    meaning: "Lingua standard. Origine: giganti. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "gnomesco": {
    meaning: "Lingua standard. Origine: gnomi. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "goblin": {
    meaning: "Lingua standard. Origine: goblinoidi. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "halfling": {
    meaning: "Lingua standard. Origine: halfling. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "orchesco": {
    meaning: "Lingua standard. Origine: orchi. Le lingue standard nacquero con i primi membri delle specie più importanti dei mondi di D&D e da allora si sono ampiamente diffuse. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "abissale": {
    meaning: "Lingua rara. Origine: demoni dell'Abisso. Le lingue rare sono segrete o derivano da altri piani di esistenza e sono quindi meno diffuse nei mondi del Piano Materiale. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "celestiale": {
    meaning: "Lingua rara. Origine: celestiali. Le lingue rare sono segrete o derivano da altri piani di esistenza e sono quindi meno diffuse nei mondi del Piano Materiale. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "druidico": {
    meaning: "Lingua rara. Origine: circoli druidici. Il druido conosce il Druidico, la lingua segreta del suo ordine. Imparando questa lingua antica, ha sbloccato anche la magia della comunicazione con gli animali; l'incantesimo parlare con gli animali è sempre considerato preparato.\n\nIl druido può usare il Druidico per lasciare messaggi nascosti. Il druido e coloro che conoscono il Druidico individuano tali messaggi automaticamente. Altri possono notare la presenza di un messaggio superando una prova di Intelligenza (Indagare) con CD 15, ma non possono decifrarlo senza l'aiuto della magia.",
    page: 80,
  },
  "gergo delle profondità": {
    meaning: "Lingua rara. Origine: aberrazioni. Le lingue rare sono segrete o derivano da altri piani di esistenza e sono quindi meno diffuse nei mondi del Piano Materiale. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "gergo ladresco": {
    meaning: "Lingua rara. Origine: gilde criminali varie. Il ladro ha appreso varie lingue nelle comunità in cui ha affinato le proprie competenze furtive. Per questo, conosce il Gergo Ladresco e un'altra lingua a scelta, selezionabili dalle tabelle delle lingue al capitolo 2.",
    page: 101,
  },
  "infernale": {
    meaning: "Lingua rara. Origine: diavoli dei Nove Inferi. Le lingue rare sono segrete o derivano da altri piani di esistenza e sono quindi meno diffuse nei mondi del Piano Materiale. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "primordiale": {
    meaning: "Lingua rara. Origine: elementali. Le lingue rare sono segrete o derivano da altri piani di esistenza e sono quindi meno diffuse nei mondi del Piano Materiale. Il Primordiale include i dialetti Aquan, Auran, Ignan e Terran. Le creature che parlano dialetti diversi di una stessa lingua sono in grado di comunicare tra loro. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "silvano": {
    meaning: "Lingua rara. Origine: Selva Fatata. Le lingue rare sono segrete o derivano da altri piani di esistenza e sono quindi meno diffuse nei mondi del Piano Materiale. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
  "sottocomune": {
    meaning: "Lingua rara. Origine: Sottosuolo. Le lingue rare sono segrete o derivano da altri piani di esistenza e sono quindi meno diffuse nei mondi del Piano Materiale. Conoscere una lingua permette di usarla per comunicare, leggere e scrivere.",
    page: 37,
  },
};

export function languageDetails(name: string): { meaning: string; page: number } | null {
  const key = normalizeLanguage(name);
  return languages.has(key) ? details[key] ?? null : null;
}
