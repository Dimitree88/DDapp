import type { Sheet } from "./sheet";
import type { FieldHelp } from "./fieldHelp";

export function recordedValueDetails(sheet: Sheet, kind: string): FieldHelp | null {
  switch (kind) {
    case "pf": return sheet.puntiFerita ? {
      meaning: `${sheet.puntiFerita} punti ferita attuali${sheet.puntiFeritaMax ? ` su ${sheet.puntiFeritaMax} massimi` : ""}. I danni riducono questo valore; le cure lo aumentano senza superare normalmente il massimo.`, rule: true,
    } : null;
    case "pfMassimi": return sheet.puntiFeritaMax ? {
      meaning: `${sheet.puntiFeritaMax} è il massimo ordinario di punti ferita registrato. Il valore può cambiare con l'avanzamento o con effetti specifici; qui resta manuale.`, rule: true,
    } : null;
    case "ca": return sheet.classeArmatura !== null ? {
      meaning: `La Classe Armatura registrata è ${sheet.classeArmatura}. Un tiro per colpire deve raggiungere almeno ${sheet.classeArmatura} per colpire. La scheda non registra quale armatura sia indossata, quindi questo valore resta manuale.`, rule: true,
    } : null;
    case "scudo": return {
      meaning: sheet.scudo ? `Scudo impugnato: sì. ${sheet.competenzeArmatura.scudi ? "Il personaggio è competente negli scudi, quindi ottiene +2 alla CA; verifica che il valore manuale della CA lo includa." : "La competenza negli scudi non è registrata, quindi lo scudo non concede il suo +2 alla CA."}` : "Scudo impugnato: no. La CA manuale non dovrebbe includere un bonus da scudo.", rule: true,
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
