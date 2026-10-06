import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { CAPITOLI, capitoloDiPagina, paginaPdf, paginaStampata, riferimentoManuale } from "../lib/manuale-2024/pagine.ts";
import { validaFileDominio, validaVoce } from "../lib/manuale-2024/schema.ts";
import { BLOCCHI_E04, CLASSI_MODULI, DOMINI } from "../lib/manuale-2024/domini.ts";
import { FILE_MANUALE } from "../lib/manuale-2024/registro.ts";
import { bloccoEquipaggiamentoAvventura, bloccoIncantesimo, chiaveOrdinamento, creaIndiceManuale, regolaDominio } from "../lib/manuale-2024/index.ts";
import { coperturaModulo, esitoRiga, espandiValori, INIZIO_T02B, moduliBlocchiIncantesimi, righe, SORGENTI, voceMadreOggetto } from "./adeguamento-2024/copertura.ts";
import blocchi from "../lib/manuale-2024/incantesimi/blocchi.json" with { type: "json" };
import matrice from "../docs/adeguamento-2024/matrice.json" with { type: "json" };
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

const moduliConStato = new Set(readdirSync("docs/adeguamento-2024/stato").map((name) => name.replace(/\.json$/, "")));
const moduliEsistenti = new Set([...moduliConStato, ...moduliBlocchiIncantesimi]);

// Voci sintetiche: verificano solo lo schema, non contengono testo del manuale.
const voceProva = (extra = {}) => ({
  id: "prova:voce", tipo: "allineamento", nome: "Voce di prova", descrizione: "Testo di prova.",
  pagina: 39, verifica: { stato: "verificata" }, ...extra,
});
const fileProva = (voci, etichette = []) => ({
  dominio: "allineamenti", modulo: "V01", fonte: "docs/regole/Manuale Del Giocatore - 2024.pdf",
  tipoPagina: "stampata", etichette, voci,
});

test("F00 page references use printed pages and verified chapter ranges", () => {
  assert.equal(paginaPdf(39), 42);
  assert.equal(paginaStampata(42), 39);
  assert.equal(paginaStampata(3), null);
  assert.throws(() => paginaPdf(0));
  assert.equal(riferimentoManuale(39), "Manuale del Giocatore 2024, p. 39");
  assert.equal(riferimentoManuale([219, 215, 219]), "Manuale del Giocatore 2024, pp. 215, 219");
  assert.equal(capitoloDiPagina(199)?.id, "capitolo-5");
  assert.equal(capitoloDiPagina(223)?.id, "capitolo-6");
  for (let index = 1; index < CAPITOLI.length; index++) {
    assert.equal(CAPITOLI[index].pagine[0], CAPITOLI[index - 1].pagine[1] + 1, CAPITOLI[index].id);
  }
});

test("F00 domain files exist, declare their owner and validate", () => {
  assert.deepEqual(Object.keys(FILE_MANUALE).sort(), Object.keys(DOMINI).sort());
  for (const [chiave, regola] of Object.entries(DOMINI)) {
    assert.ok(moduliConStato.has(regola.modulo), `${chiave}: modulo ${regola.modulo} senza file di stato`);
    assert.deepEqual(validaFileDominio(chiave, FILE_MANUALE[chiave], regola), [], chiave);
  }
  for (const [classe, modulo] of Object.entries(CLASSI_MODULI)) {
    assert.equal(DOMINI[`classi/${classe.toLocaleLowerCase("it")}`]?.modulo, modulo, classe);
  }
  assert.deepEqual(Object.keys(CLASSI_MODULI).sort(), Object.keys(regole.classi).sort());
});

test("F00 ids are unique across every domain file", () => {
  const visti = new Map();
  for (const [chiave, file] of Object.entries(FILE_MANUALE)) {
    const annidati = file.voci.flatMap((voce) => [...(voce.privilegi ?? []), ...(voce.tratti ?? [])]);
    for (const voce of [...file.etichette, ...file.voci, ...annidati]) {
      assert.ok(!visti.has(voce.id), `${voce.id} in ${chiave} e ${visti.get(voce.id)}`);
      visti.set(voce.id, chiave);
    }
  }
});

test("F00 schema rejects incomplete entries and extraction artifacts", () => {
  const regola = DOMINI.allineamenti;
  assert.deepEqual(validaFileDominio("allineamenti", fileProva([voceProva()]), regola), []);
  const errori = (extra) => validaVoce("prova", voceProva(extra), regola).join("\n");
  assert.match(errori({ descrizione: "" }), /descrizione: testo mancante/);
  assert.match(errori({ pagina: 199 }), /fuori dal dominio/);
  assert.match(errori({ pagina: 400 }), /pagina stampata non valida/);
  assert.match(errori({ descrizione: "Back­ground" }), /trattino morbido/);
  assert.match(errori({ descrizione: "Testo  doppio" }), /spazi doppi/);
  assert.match(errori({ descrizione: "Testo dall'SRD" }), /SRD/);
  assert.match(errori({ id: "Senza Prefisso" }), /id non valido/);
  assert.match(errori({ verifica: { stato: "aperta" } }), /aperta senza domanda/);
  assert.match(errori({ tipo: "talento" }), /tipo talento non ammesso[\s\S]*campo categoria mancante/);
  assert.match(errori({ tabelle: [{ titolo: "Tabella", pagina: 39, colonne: ["A", "B"], righe: [["1"]] }] }), /righe non coerenti/);
  const file = validaFileDominio("allineamenti", { ...fileProva([voceProva()]), modulo: "V02", fonte: "SRD" }, regola).join("\n");
  assert.match(file, /modulo dichiarato V02/);
  assert.match(file, /fonte diversa/);
});

test("F00 adapter finds entries by id, name or alias and never invents text", () => {
  const classe = {
    id: "classe:prova", tipo: "classe", nome: "Classe di prova", descrizione: "Testo di prova.", pagina: 50,
    dadoVita: "D12", caratteristicaPrimaria: "Forza", tiriSalvezza: ["FOR", "COS"], verifica: { stato: "da_verificare" },
    privilegi: [{ id: "classe:prova:dote", nome: "Dote", livello: 1, descrizione: "Dote della classe.", pagina: 51, verifica: { stato: "verificata" } }],
  };
  const sottoclasse = {
    id: "classe:prova:sottoclasse", tipo: "sottoclasse", classe: "Classe di prova", nome: "Via di prova", descrizione: "Testo di prova.",
    pagina: 54, verifica: { stato: "verificata" },
    privilegi: [{ id: "classe:prova:sottoclasse:dote", nome: "Dote", livello: 3, descrizione: "Dote della sottoclasse.", pagina: 54, verifica: { stato: "verificata" } }],
  };
  const indice = creaIndiceManuale({
    allineamenti: fileProva([voceProva({ alias: ["Vecchio nome"] })], [voceProva({ id: "prova:etichetta", tipo: "etichetta", nome: "Etichetta di prova" })]),
    "classi/classe di prova": { ...fileProva([classe, sottoclasse]), dominio: "classi/classe di prova", modulo: "C01" },
  });
  assert.equal(indice.voce("allineamenti", "VOCE DI PROVA")?.voce.id, "prova:voce");
  assert.equal(indice.voce("allineamenti", "vecchio nome")?.riferimento, "Manuale del Giocatore 2024, p. 39");
  assert.equal(indice.voce("allineamenti", "prova:voce")?.verificata, true);
  assert.equal(indice.voce("allineamenti", "Assente"), null);
  assert.equal(indice.etichetta("Etichetta di prova")?.dominio, "allineamenti");
  assert.equal(indice.privilegio("Dote", { classe: "Classe di prova", sottoclasse: "Via di prova" })?.voce.descrizione, "Dote della sottoclasse.");
  assert.equal(indice.privilegio("Dote", { classe: "Classe di prova" })?.voce.descrizione, "Dote della classe.");
  assert.equal(indice.perId("classe:prova:dote")?.dominio, "classi/classe di prova");
  assert.equal(creaIndiceManuale(FILE_MANUALE).voce("allineamenti", "Caotico neutrale"), null);
});

test("F00 freezes T02A/T02B, E04 and spell blocks", () => {
  const conteggi = matrice.conteggiPdf;
  assert.deepEqual([regole.talenti.origini.length, regole.talenti.generali.length, regole.talenti.stileDiCombattimento.length, regole.talenti.donoEpico.length],
    [conteggi.talenti.Origini, conteggi.talenti.Generale, conteggi.talenti["Stile di combattimento"], conteggi.talenti["Dono epico"]]);
  const primaMeta = regole.talenti.generali.filter((nome) => chiaveOrdinamento(nome) < chiaveOrdinamento(INIZIO_T02B));
  assert.equal(primaMeta.length, matrice.confini.T02A.conteggio);
  assert.equal(regole.talenti.generali.length - primaMeta.length, matrice.confini.T02B.conteggio);
  assert.ok(primaMeta.includes("Incantatore da guerra") && !primaMeta.includes("Incantatore rituale"));

  assert.deepEqual(BLOCCHI_E04.map((blocco) => blocco.dominio), Object.keys(matrice.confini.E04.conteggi));
  assert.ok(Object.values(matrice.confini.E04.conteggi).every((numero) => numero <= 25));
  assert.equal(Object.values(matrice.confini.E04.conteggi).reduce((a, b) => a + b, 0), conteggi.equipaggiamentoAvventura.righeTabella + conteggi.equipaggiamentoAvventura.varianti);
  for (const [nome, blocco] of [["Abiti da viaggiatore", "01"], ["Corda", "01"], ["Costume", "02"], ["Focus arcano", "02"], ["Fuoco dell'alchimista", "02"], ["Giaciglio", "03"], ["Munizioni", "03"], ["Pozione di guarigione", "03"], ["Profumo", "04"], ["Simbolo sacro", "04"], ["Zaino", "04"]]) {
    assert.equal(bloccoEquipaggiamentoAvventura(nome), `equipaggiamento/avventura-${blocco}`, nome);
  }
  assert.equal(voceMadreOggetto({ id: "srd52:ammo:frecce", name: "Frecce" }), "Munizioni");
  assert.equal(voceMadreOggetto({ id: "phb24:gear:focus-arcano-globo", name: "Focus arcano (globo)" }), "Focus arcano");

  const ids = blocchi.blocchi.map((blocco) => blocco.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let livello = 0; livello <= 9; livello++) {
    const delLivello = blocchi.blocchi.filter((blocco) => blocco.livello === livello);
    assert.ok(delLivello.length > 0, `livello ${livello}`);
    delLivello.forEach((blocco, indice) => {
      assert.equal(blocco.id, `I${livello}-${String(indice + 1).padStart(2, "0")}`);
      assert.equal(blocco.da === null, indice === 0, blocco.id);
      if (indice > 0 && delLivello[indice - 1].da) assert.ok(chiaveOrdinamento(delLivello[indice - 1].da) < chiaveOrdinamento(blocco.da), blocco.id);
      assert.ok(blocco.conteggioPreliminare <= blocchi.massimoVoci, blocco.id);
      assert.equal(regolaDominio(`incantesimi/${blocco.id}`)?.modulo, blocco.id);
    });
    assert.equal(delLivello.reduce((somma, blocco) => somma + blocco.conteggioPreliminare, 0), conteggi.incantesimiPreliminari.perLivello[livello], `livello ${livello}`);
  }
  assert.equal(blocchi.totalePreliminare, conteggi.incantesimiPreliminari.totale);
  for (const [livello, nome, blocco] of [[0, "Mano magica", "I0-01"], [0, "Messaggio", "I0-02"], [1, "Allarme", "I1-01"], [1, "Cura ferite", "I1-02"], [1, "Vita falsata", "I1-04"], [7, "Simulacro", "I7-02"], [9, "Desiderio", "I9-01"]]) {
    assert.equal(bloccoIncantesimo(livello, nome), blocco, nome);
  }
});

test("F00 matrix rows have one existing owner module and a computable outcome", () => {
  const ids = righe.map((riga) => riga.id);
  assert.equal(new Set(ids).size, ids.length);
  const schermate = new Set(matrice.schermate.map((schermata) => schermata.id));
  for (const riga of righe) {
    assert.ok(schermate.has(riga.schermata), `${riga.id}: schermata ${riga.schermata}`);
    assert.ok(Object.keys(matrice.tipi).includes(riga.tipo), `${riga.id}: tipo ${riga.tipo}`);
    assert.ok(Boolean(riga.modulo) !== Boolean(riga.moduloPerValore), `${riga.id}: serve un solo criterio di assegnazione`);
    if (riga.modulo) assert.ok(moduliEsistenti.has(riga.modulo), `${riga.id}: modulo ${riga.modulo}`);
    if (riga.moduloPerValore) assert.ok(riga.sorgente, `${riga.id}: moduloPerValore senza sorgente`);
    if (riga.sorgente) assert.ok(SORGENTI.includes(riga.sorgente), `${riga.id}: sorgente ${riga.sorgente}`);
    for (const dominio of riga.domini ?? []) assert.ok(DOMINI[dominio], `${riga.id}: dominio ${dominio}`);
    if (riga.modulo && riga.domini) for (const dominio of riga.domini) assert.equal(DOMINI[dominio].modulo, riga.modulo, `${riga.id}: ${dominio}`);
    assert.ok(["verificato", "da_fare", "aperto", "app"].includes(esitoRiga(riga)), riga.id);
  }
});

test("F00 every catalog value shown by the app belongs to exactly one module", () => {
  const valori = espandiValori();
  const coppie = new Map();
  for (const valore of valori) {
    assert.ok(moduliEsistenti.has(valore.modulo), `${valore.riga}: ${valore.valore} → «${valore.modulo}»`);
    if (valore.dominio) assert.ok(regolaDominio(valore.dominio)?.modulo === valore.modulo, `${valore.valore}: ${valore.dominio}`);
    const chiave = `${valore.riga}\u0000${valore.padre ?? ""}\u0000${valore.valore}`;
    assert.ok(!coppie.has(chiave) || coppie.get(chiave) === valore.modulo, chiave);
    coppie.set(chiave, valore.modulo);
  }
  const perModulo = (modulo) => valori.filter((valore) => valore.modulo === modulo).length;
  assert.equal(perModulo("V01"), 9);
  assert.equal(new Set(valori.filter((valore) => valore.riga === "talenti.valore").map((valore) => valore.modulo)).size, 5);
  assert.ok(valori.some((valore) => valore.riga === "incantesimi.valore" && valore.modulo === "I1-02" && valore.valore === "Cura ferite"));
  assert.ok(valori.filter((valore) => valore.riga === "equipaggiamento.oggetti.valore").every((valore) => ["E03", "E04"].includes(valore.modulo)));
});

// Aperture dei popup scritte nel codice dell'interfaccia: devono coincidere con la matrice.
function apertureNelCodice() {
  const sorgente = ["app/personaggio/[id]/CharacterClient.tsx", "components/fields.tsx"].map((file) => readFileSync(file, "utf8")).join("\n");
  const trovate = new Set();
  const espressione = (inizio) => {
    if (sorgente[inizio] === "\"") return sorgente.slice(inizio, sorgente.indexOf("\"", inizio + 1) + 1);
    let profondita = 0;
    for (let indice = inizio; indice < sorgente.length; indice++) {
      if (sorgente[indice] === "{") profondita++;
      if (sorgente[indice] === "}" && --profondita === 0) return sorgente.slice(inizio, indice + 1);
    }
    return "";
  };
  for (const [attributo, conDuePunti] of [[/valueInfoId=/g, true], [/<InfoLabel id=/g, false], [/<Toggle [^>]*?helpId=/g, false]]) {
    for (const corrispondenza of sorgente.matchAll(attributo)) {
      const testo = espressione(corrispondenza.index + corrispondenza[0].length);
      if (testo.startsWith("\"")) { trovate.add(`info:${testo.slice(1, -1)}`); continue; }
      for (const letterale of testo.matchAll(/`([^`]*)`|"([^"]*)"/g)) {
        if (/[!=]==\s*$/.test(testo.slice(0, letterale.index))) continue;
        const contenuto = letterale[1] ?? letterale[2];
        const prefisso = contenuto.split("${")[0];
        if (prefisso.includes(":")) trovate.add(`info:${prefisso}${contenuto.includes("${") ? "*" : ""}`);
        else if (!conDuePunti && letterale[2] !== undefined && /^[A-Z]/.test(contenuto)) trovate.add(`info:${contenuto}`);
      }
    }
  }
  for (const corrispondenza of sorgente.matchAll(/openFieldInfo\(`([^`$]*)(\$\{)?/g)) trovate.add(`info:${corrispondenza[1]}${corrispondenza[2] ? "*" : ""}`);
  for (const corrispondenza of sorgente.matchAll(/openCalculation\(\{ kind: "(\w+)"(, \w+:)?/g)) trovate.add(`calcolo:${corrispondenza[1]}${corrispondenza[2] ? ":*" : ""}`);
  return trovate;
}

test("F00 every popup opened by the interface is assigned in the matrix and vice versa", () => {
  const nelCodice = apertureNelCodice();
  const nellaMatrice = new Set(righe.map((riga) => riga.apertura).filter(Boolean));
  assert.ok(nelCodice.size >= 25, `aperture trovate: ${[...nelCodice].join(", ")}`);
  assert.deepEqual([...nelCodice].filter((apertura) => !nellaMatrice.has(apertura)), [], "aperture senza riga");
  assert.deepEqual([...nellaMatrice].filter((apertura) => !nelCodice.has(apertura)), [], "righe con apertura assente dal codice");
});

test("F00 module coverage counts verified entries only", () => {
  const verificata = fileProva([voceProva({ nome: "Legale buono", righeMatrice: ["stato.allineamento.etichetta"] }), voceProva({ id: "prova:altra", nome: "Neutrale", verifica: { stato: "aperta", note: "Domanda di prova." } })]);
  const copertura = coperturaModulo("V01", { ...FILE_MANUALE, allineamenti: verificata });
  assert.equal(copertura.valori.totale, 9);
  assert.equal(copertura.valori.verificati, 1);
  assert.deepEqual(copertura.valori.aperti, ["Neutrale (stato.allineamento.valore)"]);
  assert.equal(copertura.righe.verificate, 1);
  assert.equal(coperturaModulo("V01").valori.verificati, 0);
});
