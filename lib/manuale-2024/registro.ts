// Registro statico dei file per dominio. I file dei blocchi di incantesimi
// vanno aggiunti qui da I00 quando li crea (uno per blocco di incantesimi/blocchi.json).
import type { FileDominio } from "./schema";
import allineamenti from "./allineamenti.json";
import etichette from "./etichette.json";
import regoleGenerali from "./regole/generali.json";
import caratteristiche from "./caratteristiche.json";
import abilita from "./abilita.json";
import taglie from "./taglie.json";
import lingue from "./lingue.json";
import condizioni from "./condizioni.json";
import regoleCaratteristiche from "./regole/caratteristiche.json";
import background from "./background.json";
import specie from "./specie.json";
import lignaggi from "./lignaggi.json";
import talentiOrigini from "./talenti/origini.json";
import talentiGeneraliA from "./talenti/generali-a.json";
import talentiGeneraliB from "./talenti/generali-b.json";
import talentiStili from "./talenti/stili.json";
import talentiDoniEpici from "./talenti/doni-epici.json";
import classiBarbaro from "./classi/barbaro.json";
import classiBardo from "./classi/bardo.json";
import classiChierico from "./classi/chierico.json";
import classiDruido from "./classi/druido.json";
import classiGuerriero from "./classi/guerriero.json";
import classiLadro from "./classi/ladro.json";
import classiMago from "./classi/mago.json";
import classiMonaco from "./classi/monaco.json";
import classiPaladino from "./classi/paladino.json";
import classiRanger from "./classi/ranger.json";
import classiStregone from "./classi/stregone.json";
import classiWarlock from "./classi/warlock.json";
import equipaggiamentoArmi from "./equipaggiamento/armi.json";
import regoleAttacchi from "./regole/attacchi.json";
import equipaggiamentoArmature from "./equipaggiamento/armature.json";
import regoleClasseArmatura from "./regole/classe-armatura.json";
import equipaggiamentoStrumenti from "./equipaggiamento/strumenti.json";
import equipaggiamentoAvventura01 from "./equipaggiamento/avventura-01.json";
import equipaggiamentoAvventura02 from "./equipaggiamento/avventura-02.json";
import equipaggiamentoAvventura03 from "./equipaggiamento/avventura-03.json";
import equipaggiamentoAvventura04 from "./equipaggiamento/avventura-04.json";
import equipaggiamentoCavalcatureVeicoli from "./equipaggiamento/cavalcature-veicoli.json";
import equipaggiamentoServizi from "./equipaggiamento/servizi.json";
import equipaggiamentoMonete from "./equipaggiamento/monete.json";
import regoleIncantesimi from "./regole/incantesimi.json";

const file = (dati: unknown) => dati as FileDominio;

export const FILE_MANUALE: Record<string, FileDominio> = Object.fromEntries(Object.entries({
  allineamenti,
  etichette,
  "regole/generali": regoleGenerali,
  caratteristiche,
  abilita,
  taglie,
  lingue,
  condizioni,
  "regole/caratteristiche": regoleCaratteristiche,
  background,
  specie,
  lignaggi,
  "talenti/origini": talentiOrigini,
  "talenti/generali-a": talentiGeneraliA,
  "talenti/generali-b": talentiGeneraliB,
  "talenti/stili": talentiStili,
  "talenti/doni-epici": talentiDoniEpici,
  "classi/barbaro": classiBarbaro,
  "classi/bardo": classiBardo,
  "classi/chierico": classiChierico,
  "classi/druido": classiDruido,
  "classi/guerriero": classiGuerriero,
  "classi/ladro": classiLadro,
  "classi/mago": classiMago,
  "classi/monaco": classiMonaco,
  "classi/paladino": classiPaladino,
  "classi/ranger": classiRanger,
  "classi/stregone": classiStregone,
  "classi/warlock": classiWarlock,
  "equipaggiamento/armi": equipaggiamentoArmi,
  "regole/attacchi": regoleAttacchi,
  "equipaggiamento/armature": equipaggiamentoArmature,
  "regole/classe-armatura": regoleClasseArmatura,
  "equipaggiamento/strumenti": equipaggiamentoStrumenti,
  "equipaggiamento/avventura-01": equipaggiamentoAvventura01,
  "equipaggiamento/avventura-02": equipaggiamentoAvventura02,
  "equipaggiamento/avventura-03": equipaggiamentoAvventura03,
  "equipaggiamento/avventura-04": equipaggiamentoAvventura04,
  "equipaggiamento/cavalcature-veicoli": equipaggiamentoCavalcatureVeicoli,
  "equipaggiamento/servizi": equipaggiamentoServizi,
  "equipaggiamento/monete": equipaggiamentoMonete,
  "regole/incantesimi": regoleIncantesimi,
}).map(([chiave, dati]) => [chiave, file(dati)]));
