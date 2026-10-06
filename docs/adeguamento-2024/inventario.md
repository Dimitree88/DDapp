# Inventario dell'app per il piano 2024 (F00)

Fotografia del codice al commit `ff002ef` (branch `manuale-2024/F00`). La
matrice eseguibile è [`matrice.json`](matrice.json); questa pagina ne spiega il
contenuto e registra ciò che i moduli successivi devono sostituire.

## Schermate

| Schermata | Componenti | Contenuti di gioco |
| --- | --- | --- |
| Elenco personaggi | `app/page.tsx`, `components/CharacterCard.tsx` | Nome, classe e livello come testo, senza popup. |
| Home del personaggio | `CharacterClient.tsx` (hub) | Indice delle dieci pagine, due esportazioni PDF, storico. |
| Stato & Identità | `CharacterClient.tsx` | PF massimi, Ispirazione Eroica, CA, Classe, Livello, Sottoclasse (dal 3°), PE, Iniziativa, Bonus Competenza, Percezione Passiva, Dadi Vita, Velocità, Allineamento, Taglia base, Specie, Background, Lignaggio. |
| Lingue | idem | Lingue conosciute, note libere. |
| Caratteristiche | idem | Sei punteggi, modificatori, tiri salvezza e relativa competenza. |
| Abilità | idem | Diciotto abilità con competenza e Maestria; scelte di classe da registrare. |
| Incantesimi | idem | CD e attacco magico, slot spesi, elenco con fonte, stato e caratteristica di lancio. |
| Armi | idem | Armatura indossata, scudo, competenze in armature e armi, padronanze, armi possedute con attacco e danni. |
| Equipaggiamento | idem | Competenze negli strumenti, peso e capacità di carico, oggetti posseduti. |
| Monete | idem | Cinque monete e valore equivalente in mo. |
| Privilegi | idem | Privilegi acquisiti da classe, sottoclasse, specie e lignaggio; scelte dei privilegi; risorse; fonti delle competenze. |
| Talenti | idem | Talenti concessi e talenti acquisiti con scelte personali. |
| Storico modifiche | idem, `lib/history.ts` | Differenze fra salvataggi. |
| Esportazioni | `lib/exportPdf.ts`, `lib/exportTemplatePdf.ts`, `lib/pdfTemplateFields.json` | PDF dell'app e modello ufficiale (6 armi, 30 incantesimi). |

## Meccanismi dei popup

- **Popup informativo** (`FieldInfoContext` in `components/fields.tsx`, risolto
  in `CharacterClient.tsx`): l'ID aperto è un prefisso più il valore.
  Prefissi presenti: `stato:` (pfMassimi, ispirazione, pe, dadiVita, velocita),
  `valore:<tipo>:` (classe, livello, sottoclasse, allineamento, taglia, specie,
  background, lignaggio, talento, armatura), `lingua:`, `arma:`,
  `competenzaArma:`, `competenzaStrumento:`, `padronanza:`, `armaPosseduta:`,
  `oggetto:`, `privilegio:`, `incantesimo:`, più gli ID fissi
  `armaturaSelezionata`, `scudoSelezionato`, `Competenze armatura`,
  `Competenze armi`, `Padronanze scelte`, `Competenze negli strumenti`.
- **Popup di calcolo** (`calculationExplanation`): `armor`, `proficiency`,
  `initiative`, `passive`, `modifier:<car>`, `save:<car>`, `ability:<abilità>`.
- Il test `scripts/test-manuale-2024-F00.mjs` estrae queste aperture dal codice
  e le confronta con la matrice in entrambe le direzioni: ogni nuovo popup va
  assegnato a un modulo prima di essere aggiunto.

Divergenze rispetto al contratto del piano, da risolvere in R01:

1. Le etichette dei campi con valore (Classe, Specie, Allineamento…) aprono la
   voce del valore, non la definizione generale; con valore vuoto non aprono
   nulla. Le righe `*.etichetta` della matrice indicano dove servirà la
   definizione generale.
2. Privilegi acquisiti, talenti concessi, nomi e punteggi delle
   caratteristiche, CD e slot degli incantesimi, peso trasportato, monete e
   statistiche di lancio non aprono popup.
3. `recordedValueDetails` gestisce anche `stato:pf`, `stato:ca` e
   `stato:scudo`, oggi non raggiungibili; molte voci di `fieldHelp.ts` non sono
   raggiungibili perché i campi usano `showInfo={false}`.
4. Le lingue senza testo (Comune, Lingua dei segni comune, quasi tutte le rare)
   sono mostrate senza popup.

## Testi e dati oggi codificati nel codice

Sono le fonti che R01 dovrà sostituire con l'adapter `lib/manuale-2024`; i
moduli di contenuto li usano solo per localizzare le differenze, mai come fonte.

| File | Contenuto attuale | Problema | Modulo che fornisce il testo |
| --- | --- | --- | --- |
| `lib/valueDetails.ts` | Sintesi di 9 allineamenti, 12 classi, 12 sottoclassi, 9 specie, 8 lignaggi, 6 background, 21 talenti, 6 taglie, 4 categorie di armatura, 4 privilegi | Sintesi non testuali; 4 chiavi di sottoclasse non coincidono con i nomi del dominio («Cammino del berserker», «Giuramento di devozione», «Stregoneria draconica», «Patrono immondo») e ricadono nel testo generico | V01, C01–C12, V04, V03, T01–T04, V02, E02 |
| `lib/fieldHelp.ts` | Aiuti di campo misti a regole | Mescola aiuto dell'app e regole senza pagina | V05, V02, E01–E03 (regole); R01 (aiuto dell'app) |
| `lib/recordedValueDetails.ts` | PF, CA, scudo, Dadi Vita, PE, Ispirazione, velocità | Testi dell'app attribuiti al manuale | V05, E02 |
| `lib/calculationExplanation.ts` | Regole e pagine dei calcoli; `skillMeaning` per 18 abilità | Sintesi; pagine da verificare | V02, V05, E02 |
| `CharacterClient.tsx` | `calculationEditGuide`, testi composti di padronanza, armi, armature e scudi | Testo hardcoded nel componente | E01, E02 (regole); R01 (aiuto) |
| `lib/languageDetails.ts` | 11 lingue | Sintesi parziali | V02 |
| `lib/equipmentDetails.ts` | 15 oggetti, più armature generate | Sintesi, alcune senza pagina; nomi non di catalogo («Torce», «Frecce d'argento», «Razioni giornaliere») | E02, E04 |
| `lib/weaponDetails.ts`, `lib/weaponMastery.ts` | 38 armi (dati p. 215) e sintesi di 8 padronanze | Testo generato e sintesi | E01 |
| `lib/armorCatalog.ts`, `lib/gearCatalog.ts` | 13 armature; 134 voci di equipaggiamento di cui 37 strumenti | ID storici `srd52:*`; nessuna descrizione | E02, E03, E04 |
| `lib/spells.ts`, `lib/incantesimi-srd-2024.json`, `lib/incantesimi-dettagli-srd-2024.json`, `lib/manuale-2024-spells.json`, `lib/spellEffects.ts` | 391 nomi selezionabili; dati di lancio e pagine dell'SRD 5.2.1 per 339 voci; 70 voci del manuale solo con livello, scuola, classi e pagina; 7 effetti sintetici dall'SRD | Fonte non ammessa e pagine SRD | I00, blocchi I0–I9 |
| `lib/spellcasting.ts` | Tabella slot «SRD 5.2.1, p. 28», caratteristiche da incantatore | Fonte non ammessa | I10 con dati di C02–C04, C07, C09–C12 |
| `lib/class-feature-grants.json`, `lib/subclass-feature-grants.json` | 174 privilegi di classe e 241 di sottoclasse con livello e pagina | Nessuna descrizione | C01–C12 |
| `lib/characterGrants.ts` | Tratti di specie e lignaggio (solo nomi), talenti concessi, scelte di privilegi | Nessuna descrizione | V04, C01–C12 |
| `lib/classSkillChoices.ts`, `lib/classSavingThrows.ts`, `lib/classProgression.ts`, `lib/creationRules.ts`, `lib/speed.ts`, `lib/backgroundToolProficiencies.ts`, `lib/manuale-2024-backgrounds.json`, `lib/featPrerequisites.ts`, `lib/featToolProficiencies.ts` | Dati di classe, specie, background e talenti usati dai calcoli | Logica condivisa: i moduli forniscono i dati, R01 la riallinea | C01–C12, V03, V04, T01–T04 |

## Domini e cataloghi

Conteggi dei valori che l'app mostra oggi (espansione della matrice):

| Dominio | Valori | Modulo |
| --- | --- | --- |
| Allineamenti | 9 | V01 |
| Classi · sottoclassi | 12 · 48 | C01–C12 |
| Privilegi di classe · di sottoclasse (nomi unici) | 130 · 238 | C01–C12 |
| Specie · lignaggi · tratti | 10 · 8 · 40 | V04 |
| Background | 16 | V03 |
| Caratteristiche · abilità · taglie · lingue · condizioni | 6 · 18 · 6 · 19 · 15 | V02 |
| Talenti Origini · Generali · Stile · Dono epico | 10 · 43 (22 + 21) · 10 · 12 | T01 · T02A + T02B · T03 · T04 |
| Armi · categorie · proprietà e padronanze | 38 · 2 + 2 categorie di competenza · 10 + 8 | E01 |
| Armature e scudo · categorie | 13 · 4 | E02 |
| Strumenti | 37 | E03 |
| Equipaggiamento d'avventura e varianti | 97 | E04 |
| Cavalcature, veicoli, stili di vita, servizi · monete | 34 · 5 | E05 |
| Incantesimi | 391 | blocchi I0-01 … I9-01 |

## Valori dinamici e logiche

| Funzione | Mostrata in | Modulo della regola |
| --- | --- | --- |
| `abilityModifier`, `savingThrowBonus`, `abilityBonus`, `passivePerception` | Caratteristiche, Abilità, Stato | V02 |
| `carryingCapacity`, `inventoryWeight` | Equipaggiamento | V02 (capacità); pesi da E01–E05 |
| `proficiencyBonus`, `initiativeBonus` | Stato | V05 |
| `calculatedMaxHp`, `classHitDice` (campo ritirato, usato in migrazione) | Stato, dati | V05 con Dadi Vita di C01–C12 |
| `calculatedSpeed`, `speciesSpeed` (campo ritirato, usato in migrazione) | Stato, dati | V05 con velocità di V04 |
| `calculatedArmorClass`, `displayedArmorClass` | Stato, esportazioni | E02 |
| `weaponAttack`, `displayedWeaponAttack`, `weaponMasteryLimit`, `availableWeaponMasteries`, `proficientWeaponNames` | Armi, esportazioni | E01 con dati di classe |
| `spellcastingStats`, `spellSlots`, `availableClassSpells` | Incantesimi, esportazioni, validazione | I10 |
| `coinTotalGold` | Monete | E05 |
| `grantedPrivileges`, `featGrants`, `availableFeatChoices`, `availablePrivilegeChoices`, `classSkillChoices` | Privilegi, Talenti, Abilità | dati C01–C12, V03, V04, T01–T04; composizione R01 |
| `domainErrors`, `creationErrors` | Salvataggio | R01 |

## Esportazioni e dati salvati (R02)

- `exportPdf.ts` riporta incantesimi (nome, fonte, stato), armi con attacco e
  danni calcolati, equipaggiamento, privilegi, risorse e talenti.
- `exportTemplatePdf.ts` usa `spellDetails` per livello, tempo, gittata,
  concentrazione, rituale e materiali: oggi dati SRD, da sostituire con i
  blocchi di incantesimi.
- `normalizeSheet` converte schede storiche (alias degli incantesimi in
  `lib/spells.ts`, privilegi e talenti storici, armature e velocità); gli alias
  vanno mantenuti solo per leggere le vecchie schede.

## Confini congelati

- **T02A/T02B**: Lista dei talenti, pp. 199-200, 43 talenti Generali. T02A da
  «Abilità impeccabile» a «Incantatore da guerra» (22); T02B da «Incantatore
  rituale» a «Tiratore scelto» (21).
- **E04**: tabella Equipaggiamento d'avventura, p. 223, 82 righe, più 16
  varianti assegnate alla voce madre (5 munizioni, 5 focus arcani, 3 focus
  druidici, 3 simboli sacri). Blocchi: `avventura-01` da «Abiti da
  viaggiatore» a «Corda» (25); `avventura-02` da «Costume» a «Fuoco
  dell'alchimista» con focus (25); `avventura-03` da «Giaciglio» a «Pozione di
  guarigione» con munizioni (25); `avventura-04` da «Profumo» a «Zaino» con
  simboli sacri (23).
- **Incantesimi**: 25 blocchi in
  [`lib/manuale-2024/incantesimi/blocchi.json`](../../lib/manuale-2024/incantesimi/blocchi.json),
  per livello e per inizio alfabetico, con conteggio preliminare massimo 18.

## Differenze già visibili fra app e PDF

Da verificare nei rispettivi moduli, senza correggerle in F00:

- incantesimi: 391 nomi nell'app, 390 righe di livello contate nel PDF; le
  pagine attuali sono dell'SRD (I00);
- equipaggiamento d'avventura: 97 voci non-strumento nell'app contro 98
  previste dalla tabella e dalle varianti (E04);
- background, specie, talenti, privilegi: descrizioni assenti o sintetiche per
  la maggior parte delle voci (V03, V04, T01–T04, C01–C12);
- cavalcature, veicoli, stili di vita e servizi: presenti solo come elenchi di
  nomi, non selezionabili (E05).
