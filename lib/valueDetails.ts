import regole from "./regole-srd-2024.json";
import manual from "./manuale-2024-entities.json";
import backgrounds2024 from "./manuale-2024-backgrounds.json";
import { proficiencyBonus } from "./abilityBonus";

export type ValueDetail = { meaning: string; rule?: boolean; page?: number };

const alignments: Record<string, string> = {
  "Legale buono": "Cerca di fare ciò che è giusto secondo la società; tende a combattere le ingiustizie e a proteggere gli innocenti.",
  "Neutrale buono": "Cerca di aiutare gli altri, seguendo le regole quando sono utili senza sentirsi vincolato da esse.",
  "Caotico buono": "Segue la propria coscienza anche quando questo contrasta con le aspettative o le regole altrui.",
  "Legale neutrale": "Agisce secondo leggi, tradizioni o un codice personale, mantenendo una condotta disciplinata.",
  Neutrale: "Evita di schierarsi per principio nelle questioni morali e sceglie ciò che gli sembra migliore di volta in volta.",
  "Caotico neutrale": "Segue i propri impulsi e antepone la libertà personale alle regole e alle aspettative degli altri.",
  "Legale malvagio": "Persegue i propri interessi con metodo, restando entro un codice di tradizione, lealtà o ordine.",
  "Neutrale malvagio": "Persegue i propri desideri senza preoccuparsi dei danni che causa agli altri.",
  "Caotico malvagio": "Agisce con violenza arbitraria, spesso spinto dall'odio o dalla sete di distruzione.",
  "Senza allineamento": "Non segue un orientamento morale: è la condizione tipica di creature prive di pensiero razionale.",
};

const classes: Record<string, string> = {
  Barbaro: "Combatte grazie a Ira, forza fisica e resistenza. Il suo Dado Vita è d12.",
  Bardo: "Usa Ispirazione Bardica e magia per sostenere gli alleati. La sua caratteristica da incantatore è Carisma.",
  Chierico: "Trae magia e poteri divini dalla propria fede. La sua caratteristica da incantatore è Saggezza.",
  Druido: "Usa magia della natura e Forma Selvatica. La sua caratteristica da incantatore è Saggezza.",
  Guerriero: "È specializzato nel combattimento e può usare Azione Impetuosa e Recuperare Energie.",
  Ladro: "Sfrutta abilità, Attacco Furtivo e Azione Scaltra per agire con precisione e mobilità.",
  Mago: "Studia gli incantesimi nel proprio libro. La sua caratteristica da incantatore è Intelligenza.",
  Monaco: "Usa arti marziali e punti concentrazione per tecniche speciali e movimento.",
  Paladino: "Unisce combattimento, magia divina e Imposizione delle Mani. La sua caratteristica da incantatore è Carisma.",
  Ranger: "Unisce armi, esplorazione e magia della natura. La sua caratteristica da incantatore è Saggezza.",
  Stregone: "Lancia magia innata e può modificarla con Metamagia. La sua caratteristica da incantatore è Carisma.",
  Warlock: "Trae potere da un patrono e usa Magia del Patto. La sua caratteristica da incantatore è Carisma.",
};

const subclasses: Record<string, string> = {
  "Cammino del berserker": "Specializzazione del Barbaro che intensifica l'Ira e gli attacchi durante il combattimento.",
  "Collegio della Sapienza": "Specializzazione del Bardo orientata a conoscenze, abilità e Segreti Magici.",
  "Dominio della Vita": "Specializzazione del Chierico che rafforza le cure e la protezione della vita.",
  "Circolo della Terra": "Specializzazione del Druido legata alla magia di un ambiente naturale scelto.",
  Campione: "Specializzazione del Guerriero che migliora la capacità di combattimento e i colpi critici.",
  Furfante: "Specializzazione del Ladro che sfrutta mobilità, furtività e uso rapido degli oggetti.",
  Invocatore: "Specializzazione del Mago incentrata sugli incantesimi di Invocazione.",
  "Guerriero della Mano Aperta": "Specializzazione del Monaco che aggiunge tecniche di controllo ai colpi senz'armi.",
  "Giuramento di devozione": "Specializzazione del Paladino votata alla devozione e alla protezione degli altri.",
  Cacciatore: "Specializzazione del Ranger che adatta le proprie tecniche alla preda.",
  "Stregoneria draconica": "Specializzazione dello Stregone che manifesta poteri legati ai draghi.",
  "Patrono immondo": "Specializzazione del Warlock il cui patrono è un immondo.",
};

const species: Record<string, string> = {
  Dragonide: "Discende dai draghi; possiede un soffio e una resistenza legati al proprio retaggio draconico.",
  Elfo: "Possiede tratti fatati, sensi acuti e un lignaggio che ne determina ulteriori capacità.",
  Gnomo: "Piccolo, dotato di astuzia magica e di un lignaggio delle foreste o delle rocce.",
  Goliath: "Discende dai giganti e sceglie un retaggio che concede una capacità specifica.",
  Halfling: "Piccolo e agile, con il tratto Fortunato che permette di ritirare un 1 su un d20.",
  Nano: "Possiede scurovisione, resistenza nanica e una particolare robustezza.",
  Orco: "Possiede scurovisione, resistenza e capacità di scattare verso il combattimento.",
  Tiefling: "Possiede un retaggio planare che determina resistenza e magie innate.",
  Umano: "Versatile: ottiene una competenza in un'abilità e un talento di origine aggiuntivo.",
};

const lineages: Record<string, string> = {
  Drow: "Lignaggio elfico legato al Sottosuolo; concede magie innate proprie dei drow.",
  "Elfo alto": "Lignaggio elfico che concede un trucchetto da mago e ulteriori magie con l'avanzamento.",
  "Elfo dei boschi": "Lignaggio elfico che migliora la mobilità e concede magie legate alla natura.",
  "Gnomo delle foreste": "Lignaggio gnomesco che permette di comunicare con piccoli animali e usare Illusione Minore.",
  "Gnomo delle rocce": "Lignaggio gnomesco capace di creare piccoli congegni magici.",
  Abissale: "Retaggio tiefling legato all'Abisso, con resistenza e magie innate proprie.",
  Ctonio: "Retaggio tiefling legato ai piani inferiori ctonii, con resistenza e magie innate proprie.",
  Infernale: "Retaggio tiefling legato ai Nove Inferi, con resistenza al fuoco e magie innate proprie.",
};

const backgrounds: Record<string, string> = {
  Accolito: "Cresciuto in una comunità religiosa o al servizio di un luogo sacro.",
  Criminale: "Ha vissuto di attività illecite e sa muoversi negli ambienti criminali.",
  Sapiente: "Ha dedicato gli anni formativi allo studio e alla ricerca di conoscenze.",
  Soldato: "Ha ricevuto addestramento militare e conosce la disciplina del combattimento.",
  Eremita: "Ha trascorso un periodo di isolamento dedicato alla riflessione, alla ricerca o alla sopravvivenza.",
  Guida: "Conosce la vita all'aperto e accompagna altri attraverso territori selvaggi.",
};

const feats: Record<string, string> = {
  Abile: "Concede competenza in tre abilità o strumenti a scelta.",
  "Aggressore selvaggio": "Permette di ripetere una volta per turno i dadi dei danni di un'arma e scegliere il risultato preferito.",
  Allerta: "Aggiunge il bonus di competenza all'Iniziativa; questo effetto è già calcolato nella scheda.",
  "Iniziato alla magia": "Concede due trucchetti e un incantesimo di 1° livello da una lista scelta.",
  Guaritore: "Permette di usare una borsa da guaritore per curare e di migliorare i dadi di guarigione.",
  "Lavoro manuale": "Concede competenza negli strumenti da artigiano scelti e agevola la creazione di oggetti.",
  "Aumento dei punteggi di caratteristica": "Aumenta i punteggi di caratteristica scelti, entro il limite previsto dal talento.",
  Lottatore: "Migliora i colpi senz'armi e la capacità di afferrare una creatura.",
  "Combattere con armi possenti": "Aumenta i danni minimi ottenuti con armi da mischia impugnate a due mani.",
  "Combattere con due armi": "Permette di aggiungere il modificatore di caratteristica ai danni dell'attacco extra con arma leggera.",
  Difesa: "Concede +1 alla Classe Armatura mentre si indossa un'armatura.",
  Tiro: "Concede +2 ai tiri per colpire con armi a distanza.",
  "Dono del fato": "Permette di influenzare il risultato di una prova con d20 di una creatura vicina.",
  "Dono della vista pura": "Concede Vista Pura entro una distanza limitata.",
  "Dono delle abilità di combattimento": "Migliora un attacco mancato una volta per turno.",
  "Dono dell'offensiva irresistibile": "Permette agli attacchi di superare le resistenze ai danni e potenzia i colpi critici.",
  "Dono dello spirito notturno": "Concede difese legate alle ombre e capacità di muoversi al riparo da esse.",
  "Dono del richiamo degli incantesimi": "Permette di lanciare alcuni incantesimi senza consumare slot.",
  "Dono del viaggio dimensionale": "Migliora il teletrasporto e la mobilità tra luoghi.",
};

const sizes: Record<string, string> = {
  Minuscola: "Taglia inferiore a Piccola: influisce sullo spazio occupato e su alcune interazioni di gioco.",
  Piccola: "Taglia delle creature più piccole di un umano, come gnomi e halfling.",
  Media: "Taglia di un umano adulto e di molte altre specie giocabili.",
  Grande: "Taglia superiore a Media: occupa più spazio sul campo di gioco.",
  Enorme: "Taglia superiore a Grande: occupa uno spazio ancora più ampio.",
  Mastodontica: "La categoria di taglia più grande prevista dalle regole.",
};

const armorTraining: Record<string, string> = {
  Leggere: "Permette di indossare efficacemente armature leggere, che includono il modificatore di Destrezza nella CA.",
  Medie: "Permette di indossare efficacemente armature medie; alla CA si aggiunge Destrezza fino a un massimo di +2.",
  Pesanti: "Permette di indossare efficacemente armature pesanti, la cui CA non aggiunge Destrezza.",
  Scudi: "Permette di ottenere il +2 alla CA da uno scudo impugnato.",
};

const privileges: Record<string, string> = {
  "Padronanza d'armi": "Permette di usare la proprietà di padronanza delle armi scelte; è distinta dalla normale competenza nell'arma.",
  "Esploratore esperto": "Privilegio del Ranger che concede Maestria in una delle abilità in cui è competente.",
  "Stile di combattimento": "Permette di scegliere un talento di stile di combattimento, come Tiro o Difesa.",
  "Nemico prescelto": "Privilegio del Ranger che concede Marchio del Cacciatore e alcuni lanci senza spendere slot.",
};

const catalogs: Record<string, Record<string, string>> = {
  allineamento: alignments, classe: classes, sottoclasse: subclasses,
  specie: species, lignaggio: lineages, background: backgrounds,
  talento: feats, taglia: sizes,
  armatura: armorTraining, privilegio: privileges,
};

export function valueDetails(kind: string, value: string): ValueDetail | null {
  if (kind === "livello" && regole.livelliPersonaggio.includes(value as typeof regole.livelliPersonaggio[number])) {
    return { meaning: `Il personaggio è di ${value}° livello. Il suo bonus di competenza è ${proficiencyBonus(value)}.`, rule: true };
  }
  const meaning = catalogs[kind]?.[value];
  if (meaning) return { meaning, rule: true };
  if (kind === "sottoclasse") {
    const owner = Object.entries(manual.classes).find(([, options]) => options.includes(value));
    if (owner) return { meaning: `Sottoclasse del ${owner[0]}, descritta nel Manuale del Giocatore 2024. I privilegi specifici dipendono dal livello del personaggio.`, rule: true };
  }
  if (kind === "background") {
    const entry = (backgrounds2024 as Record<string, { feat: string; skills: string[] }>)[value];
    if (entry) return { meaning: `Background del Manuale del Giocatore 2024. Concede ${entry.feat} e competenza in ${entry.skills.join(" e ")}.`, rule: true };
  }
  if (kind === "specie" && value === "Aasimar") return {
    meaning: "Specie del Manuale del Giocatore 2024. Può essere Media o Piccola; possiede tratti celestiali e una rivelazione dal 3° livello.", rule: true,
  };
  if (kind === "talento") {
    const category = Object.entries(manual.feats).find(([, options]) => options.includes(value))?.[0];
    if (category) return { meaning: `Talento ${category === "origini" ? "Origini" : category === "generali" ? "Generale" : category === "stileDiCombattimento" ? "Stile di combattimento" : "Dono epico"} del Manuale del Giocatore 2024.`, rule: true };
  }
  return null;
}
