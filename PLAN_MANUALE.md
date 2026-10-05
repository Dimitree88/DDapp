# Piano: copia testuale verificata del Manuale del Giocatore 2024

## Risultato atteso

Ottenere una copia locale **integrale, organizzata e verificata** di `docs/regole/Manuale Del Giocatore - 2024.pdf`. Regole, liste, descrizioni, tabelle e riferimenti devono essere trovabili e leggibili nella copia senza dover cercare nel PDF. Il PDF resta l'unica fonte da cui costruirla e il documento da usare per risolvere eventuali dubbi; non si usano Internet, SRD o altri manuali.

La copia non sarà un unico file enorme: avrà capitoli e sezioni navigabili, un indice per pagina e un comando di ricerca che restituisce immediatamente il testo e il riferimento preciso. Verrà tenuta in locale e ignorata da Git, perché il repository è pubblico; nel repository resteranno strumenti, istruzioni e stato della verifica.

## Struttura della copia

Per ogni contenuto conservare testo originale verificato, capitolo, sezione, numero di pagina stampato e pagina del PDF. In particolare:

- Riprodurre paragrafi, titoli, sottotitoli, elenchi puntati e numerati nell'ordine originale.
- Trascrivere integralmente tabelle, intestazioni, celle, note e rimandi; se una tabella non è rappresentabile fedelmente in Markdown, usare un formato strutturato affiancato a una vista leggibile.
- Includere riquadri, didascalie, appendici, indici e testo presente nelle figure. Per diagrammi o immagini che portano informazioni non riducibili a testo, conservare un ritaglio locale e una descrizione verificata, collegati alla pagina.
- Mantenere le grafie e i numeri del manuale. Ogni correzione di errori di estrazione deve essere tracciata; nessuna parafrasi deve sostituire il testo originale.
- Conservare separatamente estrazione grezza con coordinate, trascrizione corretta e registro delle verifiche, così ogni passaggio resta rintracciabile.

## Lavoro da svolgere

1. **Inventario delle pagine.** Registrare numero totale, pagine stampate, capitoli, appendici e pagine con immagini o testo non estraibile. Calcolare l'hash SHA-256 del PDF per legare la copia a questa precisa versione.
2. **Prima estrazione locale.** Estrarre testo e coordinate da ogni pagina. Ricostruire paragrafi, titoli, colonne ed elenchi; trattare le tabelle separatamente. Usare OCR solo in locale sulle pagine o porzioni senza testo estraibile.
3. **Trascrizione organizzata.** Suddividere per capitolo e sezione, mantenendo marcatori di pagina. Conservare i ritagli necessari per figure e diagrammi. Applicare le correzioni manuali in file separati dalla prima estrazione, affinché una nuova generazione non le cancelli.
4. **Verifica completa.** Confrontare **ogni pagina** della copia con la pagina renderizzata del PDF, non soltanto campioni. Controllare presenza e ordine di tutti i blocchi, esattezza di numeri, nomi, tabelle, elenchi, note e rimandi. Segnare ciascuna pagina come verificata solo dopo il confronto; risolvere tutte le lacune prima di dichiarare completa la copia.
5. **Ricerca e navigazione.** Creare un indice testuale per capitolo, titolo e pagina, più un comando di ricerca per termini esatti e varianti di accento o spaziatura. Ogni risultato deve mostrare il passaggio nella copia, il suo contesto e la pagina di origine. Valutare un indice full-text locale solo se la ricerca nei file non è sufficiente.
6. **Prova d'uso.** Cercare nell'indice esempi di regole, oggetti, elenchi, tabelle, privilegi e incantesimi distribuiti nel manuale. Verificare che siano recuperabili e comprensibili direttamente dalla copia, senza sfogliare il PDF durante la ricerca.

## Condizioni di completamento

- Tutte le pagine e tutti i contenuti informativi del PDF sono rappresentati; nessuna pagina risulta mancante o ancora da verificare.
- Tabelle, elenchi, numeri, note, rimandi e contenuti grafici rilevanti sono leggibili e corretti nella copia.
- Ogni sezione ha riferimenti di pagina affidabili; la ricerca restituisce subito il testo pertinente.
- Il registro delle verifiche non contiene dubbi aperti o omissioni note.
- Strumenti e istruzioni permettono di ricostruire la copia dalla stessa versione del PDF senza perdere le correzioni verificate. Una versione diversa del PDF richiede una nuova verifica delle parti cambiate.

## Regola per gli agenti: solo alla fine

**Non modificare ora `AGENTS.md`.** Finché la copia non soddisfa tutte le condizioni sopra, resta valida l'istruzione attuale di verificare nel PDF locale. Solo a piano completato aggiornare `AGENTS.md` per indicare la copia verificata come riferimento operativo quotidiano, derivato esclusivamente dal PDF, e il PDF come riscontro per incongruenze o nuove versioni. Il divieto di cercare regole su Internet o in altre fonti rimane.
