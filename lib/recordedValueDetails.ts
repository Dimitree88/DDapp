import type { Sheet } from "./sheet";
import type { FieldHelp } from "./fieldHelp";
import { calculatedArmorClass, displayedArmorClass } from "./armorClass";
import { armorById } from "./armorCatalog";

export function recordedValueDetails(sheet: Sheet, kind: string): FieldHelp | null {
  switch (kind) {
    case "pf": return sheet.puntiFerita ? {
      meaning: `${sheet.puntiFerita} punti ferita attuali${sheet.puntiFeritaMax ? ` su ${sheet.puntiFeritaMax} massimi` : ""}. I danni riducono questo valore; le cure lo aumentano senza superare normalmente il massimo.`, rule: true,
    } : null;
    case "pfMassimi": return sheet.puntiFeritaMax ? {
      meaning: `${sheet.puntiFeritaMax} è il massimo ordinario di punti ferita registrato. Il valore può cambiare con l'avanzamento o con effetti specifici; qui resta manuale.`, rule: true,
    } : null;
    case "ca": {
      const value = displayedArmorClass(sheet);
      const calculated = calculatedArmorClass(sheet);
      return value ? {
        meaning: `Classe Armatura: ${value}. ${sheet.classeArmaturaOverride != null ? `Valore manuale; il calcolo ordinario sarebbe ${calculated?.value ?? "non disponibile"}.` : calculated ? `Calcolo automatico: ${calculated.formula}.` : "Valore registrato; inserisci Destrezza per il calcolo automatico."}${calculated?.warnings.length ? ` ${calculated.warnings.join(" ")}` : ""}${sheet.classeArmaturaOverride != null ? " Per tornare al calcolo automatico, svuota il valore manuale." : ""}`, rule: true,
      } : null;
    }
    case "scudo": return {
      meaning: sheet.scudo || sheet.equipaggiamento.some((item) => item.impugnato && armorById(item.catalogId ?? "")?.category === "scudi") ? `Scudo impugnato: sì. ${sheet.competenzeArmatura.scudi ? "Il bonus dello scudo entra nel calcolo automatico della CA." : "Senza competenza lo scudo non aggiunge CA."}` : "Scudo impugnato: no. Per usare uno scudo puoi selezionare Sì qui o segnarlo come impugnato negli Oggetti.", rule: true,
    };
    case "dadiVita": return sheet.dadiVita ? {
      meaning: `Dadi Vita massimi registrati: ${sheet.dadiVita}. Durante un riposo breve se ne possono spendere per recuperare punti ferita. La scheda non registra quanti ne siano già stati spesi.`, rule: true,
    } : null;
    case "pe": return sheet.puntiEsperienza ? {
      meaning: `${sheet.puntiEsperienza} punti esperienza registrati. Il livello indicato nella scheda è ${sheet.livello}; l'avanzamento del livello viene deciso e inserito separatamente.`, rule: true,
    } : null;
    case "ispirazione": return {
      meaning: sheet.ispirazioneEroica ? "Il personaggio possiede Ispirazione Eroica e può spenderla per ritirare un dado appena tirato, usando il nuovo risultato." : "Il personaggio non possiede attualmente Ispirazione Eroica.", rule: true,
    };
    case "velocita": return sheet.velocita ? {
      meaning: `Velocità registrata: ${sheet.velocita} metri per un movimento. Effetti temporanei o condizioni possono modificarla; non sono rappresentati in questo campo.`, rule: true,
    } : null;
    default: return null;
  }
}
