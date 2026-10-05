# Archivio delle entità del Manuale del Giocatore 2024

Fonte principale: `docs/regole/Manuale Del Giocatore - 2024.pdf`. I numeri di pagina qui sotto sono quelli stampati sul manuale; nel PDF la pagina fisica è tre posizioni più avanti.

L'archivio interrogabile è `lib/entityArchive.ts`. Le voci trascritte dall'indice e dalle descrizioni del Manuale sono in `lib/manuale-2024-entities.json`. Ogni gruppo indica se è già stato confrontato col Manuale (`verified`) o se deriva ancora da un catalogo SRD preesistente (`existing-to-audit`). I domini attivi di classi, sottoclassi, background, specie, talenti e incantesimi usano ora queste voci. Le schede salvate non sono state modificate direttamente.

| Entità | Manuale 2024 | Prima della migrazione | Stato attuale |
| --- | ---: | ---: | --- |
| Classi | 12 | 12 | Nomi nell'archivio |
| Sottoclassi | 48 | 12 | Tutti i nomi nel menu; mancano progressioni e privilegi delle 36 aggiunte |
| Background | 16 | 6 | Tutti i nomi nel menu, con talenti, caratteristiche e competenze di base registrati; mancano dotazioni e scelte guidate degli strumenti |
| Specie | 10 | 9 | Aasimar nel menu, con taglia e tratti principali; gli effetti dei tratti non sono ancora automatizzati |
| Talenti | 75 | 19 | Tutti i nomi e le categorie nel menu; i prerequisiti principali filtrano le scelte, mentre gli effetti dei nuovi talenti non sono ancora automatizzati |
| Armi | da ricontrollare in dettaglio | 38 | Catalogo SRD collegato all'archivio |
| Armature | da ricontrollare in dettaglio | 13 | Catalogo SRD collegato all'archivio |
| Strumenti | da ricontrollare in dettaglio | 23 | Catalogo SRD collegato all'archivio |
| Altro equipaggiamento | da ricontrollare in dettaglio | 80 | Catalogo SRD collegato all'archivio |
| Oggetti magici già catalogati | non è un elenco esaustivo nel Manuale | 3 | Menu separato: pozione di guarigione, pergamene magiche di trucchetto/1° livello e voce personalizzata |
| Incantesimi | da riconciliare | 339 | Il menu contiene 402 nomi candidati: i 339 del catalogo SRD e 63 nomi del Manuale. Il totale include alias da riconciliare. Per i 63 nuovi nomi sono registrati livello, scuola, classi e pagina; gli altri dettagli di lancio sono ancora da trascrivere |

L'archivio include anche livelli, lignaggi, lingue, allineamenti, taglie, caratteristiche, abilità, 15 condizioni, 8 cavalcature, 12 veicoli, 7 stili di vita, 7 servizi, privilegi già modellati, proprietà di padronanza delle armi e monete. I privilegi e gli incantesimi richiedono un confronto voce per voce prima di diventare domini completi.

## Regole di accesso agli oggetti magici

Il Manuale, p. 232, attribuisce al DM la decisione su quando i personaggi trovano oggetti magici. Alcuni oggetti richiedono sintonia o requisiti specifici; il limite generale è di tre oggetti in sintonia. L'archivio tiene questi oggetti separati. Nella scheda del personaggio un oggetto magico compare solo dopo essere stato aggiunto. Il pulsante per aggiungerlo può essere visibile a tutti i personaggi che soddisfano gli eventuali requisiti dell'oggetto; la semplice presenza nel catalogo non implica possesso.

## Caso Erin

Erin è Druido di livello 2 con background Guida. La sua scheda salvata ha un privilegio vuoto e un solo talento, `Iniziato alla magia`, con nota “Due trucchetti e un incantesimo da Mago”. Il Manuale, background Guida a p. 181, concede `Iniziato alla magia (Druido)`; il privilegio druidico `Ordine primordiale` offre invece la scelta `Mago` o `Custode` a p. 80. Questi due usi della parola “Mago” sono distinti. La nota di Erin non permette di stabilire da sola se descriva una seconda acquisizione del talento o se confonda le due scelte. Occorre conservare il dato della scheda finché la provenienza non è chiarita.

## Passaggio ai menu

1. Completare privilegi e progressioni delle 36 nuove sottoclassi, dotazioni e scelte guidate dei background e effetti dei nuovi talenti.
2. Riconciliare gli alias degli incantesimi e completare i dettagli di lancio delle 63 voci aggiunte.
3. Confrontare uno per uno armi, armature, strumenti ed equipaggiamento con il Manuale e aggiungere gli oggetti magici effettivamente disponibili nella campagna.
