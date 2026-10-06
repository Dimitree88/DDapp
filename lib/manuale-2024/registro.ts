// Generato da scripts/adeguamento-2024/genera-registro.mjs: non modificare a mano.
import type { FileDominio, TestiDominio } from "./schema";
import fileAllineamenti from "./allineamenti.json";
import testiAllineamenti from "./testi/allineamenti.json";
import fileEtichette from "./etichette.json";
import testiEtichette from "./testi/etichette.json";
import fileRegoleGenerali from "./regole/generali.json";
import testiRegoleGenerali from "./testi/regole/generali.json";
import fileCaratteristiche from "./caratteristiche.json";
import testiCaratteristiche from "./testi/caratteristiche.json";
import fileAbilita from "./abilita.json";
import testiAbilita from "./testi/abilita.json";
import fileTaglie from "./taglie.json";
import testiTaglie from "./testi/taglie.json";
import fileLingue from "./lingue.json";
import testiLingue from "./testi/lingue.json";
import fileCondizioni from "./condizioni.json";
import testiCondizioni from "./testi/condizioni.json";
import fileRegoleCaratteristiche from "./regole/caratteristiche.json";
import testiRegoleCaratteristiche from "./testi/regole/caratteristiche.json";
import fileBackground from "./background.json";
import testiBackground from "./testi/background.json";
import fileSpecie from "./specie.json";
import testiSpecie from "./testi/specie.json";
import fileLignaggi from "./lignaggi.json";
import testiLignaggi from "./testi/lignaggi.json";
import fileTalentiOrigini from "./talenti/origini.json";
import testiTalentiOrigini from "./testi/talenti/origini.json";
import fileTalentiGeneraliA from "./talenti/generali-a.json";
import testiTalentiGeneraliA from "./testi/talenti/generali-a.json";
import fileTalentiGeneraliB from "./talenti/generali-b.json";
import testiTalentiGeneraliB from "./testi/talenti/generali-b.json";
import fileTalentiStili from "./talenti/stili.json";
import testiTalentiStili from "./testi/talenti/stili.json";
import fileTalentiDoniEpici from "./talenti/doni-epici.json";
import testiTalentiDoniEpici from "./testi/talenti/doni-epici.json";
import fileClassiBarbaro from "./classi/barbaro.json";
import testiClassiBarbaro from "./testi/classi/barbaro.json";
import fileClassiBardo from "./classi/bardo.json";
import testiClassiBardo from "./testi/classi/bardo.json";
import fileClassiChierico from "./classi/chierico.json";
import testiClassiChierico from "./testi/classi/chierico.json";
import fileClassiDruido from "./classi/druido.json";
import testiClassiDruido from "./testi/classi/druido.json";
import fileClassiGuerriero from "./classi/guerriero.json";
import testiClassiGuerriero from "./testi/classi/guerriero.json";
import fileClassiLadro from "./classi/ladro.json";
import testiClassiLadro from "./testi/classi/ladro.json";
import fileClassiMago from "./classi/mago.json";
import testiClassiMago from "./testi/classi/mago.json";
import fileClassiMonaco from "./classi/monaco.json";
import testiClassiMonaco from "./testi/classi/monaco.json";
import fileClassiPaladino from "./classi/paladino.json";
import testiClassiPaladino from "./testi/classi/paladino.json";
import fileClassiRanger from "./classi/ranger.json";
import testiClassiRanger from "./testi/classi/ranger.json";
import fileClassiStregone from "./classi/stregone.json";
import testiClassiStregone from "./testi/classi/stregone.json";
import fileClassiWarlock from "./classi/warlock.json";
import testiClassiWarlock from "./testi/classi/warlock.json";
import fileEquipaggiamentoArmi from "./equipaggiamento/armi.json";
import testiEquipaggiamentoArmi from "./testi/equipaggiamento/armi.json";
import fileRegoleAttacchi from "./regole/attacchi.json";
import testiRegoleAttacchi from "./testi/regole/attacchi.json";
import fileEquipaggiamentoArmature from "./equipaggiamento/armature.json";
import testiEquipaggiamentoArmature from "./testi/equipaggiamento/armature.json";
import fileRegoleClasseArmatura from "./regole/classe-armatura.json";
import testiRegoleClasseArmatura from "./testi/regole/classe-armatura.json";
import fileEquipaggiamentoStrumenti from "./equipaggiamento/strumenti.json";
import testiEquipaggiamentoStrumenti from "./testi/equipaggiamento/strumenti.json";
import fileEquipaggiamentoAvventura01 from "./equipaggiamento/avventura-01.json";
import testiEquipaggiamentoAvventura01 from "./testi/equipaggiamento/avventura-01.json";
import fileEquipaggiamentoAvventura02 from "./equipaggiamento/avventura-02.json";
import testiEquipaggiamentoAvventura02 from "./testi/equipaggiamento/avventura-02.json";
import fileEquipaggiamentoAvventura03 from "./equipaggiamento/avventura-03.json";
import testiEquipaggiamentoAvventura03 from "./testi/equipaggiamento/avventura-03.json";
import fileEquipaggiamentoAvventura04 from "./equipaggiamento/avventura-04.json";
import testiEquipaggiamentoAvventura04 from "./testi/equipaggiamento/avventura-04.json";
import fileEquipaggiamentoCavalcatureVeicoli from "./equipaggiamento/cavalcature-veicoli.json";
import testiEquipaggiamentoCavalcatureVeicoli from "./testi/equipaggiamento/cavalcature-veicoli.json";
import fileEquipaggiamentoServizi from "./equipaggiamento/servizi.json";
import testiEquipaggiamentoServizi from "./testi/equipaggiamento/servizi.json";
import fileEquipaggiamentoMonete from "./equipaggiamento/monete.json";
import testiEquipaggiamentoMonete from "./testi/equipaggiamento/monete.json";
import fileRegoleIncantesimi from "./regole/incantesimi.json";
import testiRegoleIncantesimi from "./testi/regole/incantesimi.json";

export const FILE_MANUALE: Record<string, FileDominio> = {
  "allineamenti": fileAllineamenti as unknown as FileDominio,
  "etichette": fileEtichette as unknown as FileDominio,
  "regole/generali": fileRegoleGenerali as unknown as FileDominio,
  "caratteristiche": fileCaratteristiche as unknown as FileDominio,
  "abilita": fileAbilita as unknown as FileDominio,
  "taglie": fileTaglie as unknown as FileDominio,
  "lingue": fileLingue as unknown as FileDominio,
  "condizioni": fileCondizioni as unknown as FileDominio,
  "regole/caratteristiche": fileRegoleCaratteristiche as unknown as FileDominio,
  "background": fileBackground as unknown as FileDominio,
  "specie": fileSpecie as unknown as FileDominio,
  "lignaggi": fileLignaggi as unknown as FileDominio,
  "talenti/origini": fileTalentiOrigini as unknown as FileDominio,
  "talenti/generali-a": fileTalentiGeneraliA as unknown as FileDominio,
  "talenti/generali-b": fileTalentiGeneraliB as unknown as FileDominio,
  "talenti/stili": fileTalentiStili as unknown as FileDominio,
  "talenti/doni-epici": fileTalentiDoniEpici as unknown as FileDominio,
  "classi/barbaro": fileClassiBarbaro as unknown as FileDominio,
  "classi/bardo": fileClassiBardo as unknown as FileDominio,
  "classi/chierico": fileClassiChierico as unknown as FileDominio,
  "classi/druido": fileClassiDruido as unknown as FileDominio,
  "classi/guerriero": fileClassiGuerriero as unknown as FileDominio,
  "classi/ladro": fileClassiLadro as unknown as FileDominio,
  "classi/mago": fileClassiMago as unknown as FileDominio,
  "classi/monaco": fileClassiMonaco as unknown as FileDominio,
  "classi/paladino": fileClassiPaladino as unknown as FileDominio,
  "classi/ranger": fileClassiRanger as unknown as FileDominio,
  "classi/stregone": fileClassiStregone as unknown as FileDominio,
  "classi/warlock": fileClassiWarlock as unknown as FileDominio,
  "equipaggiamento/armi": fileEquipaggiamentoArmi as unknown as FileDominio,
  "regole/attacchi": fileRegoleAttacchi as unknown as FileDominio,
  "equipaggiamento/armature": fileEquipaggiamentoArmature as unknown as FileDominio,
  "regole/classe-armatura": fileRegoleClasseArmatura as unknown as FileDominio,
  "equipaggiamento/strumenti": fileEquipaggiamentoStrumenti as unknown as FileDominio,
  "equipaggiamento/avventura-01": fileEquipaggiamentoAvventura01 as unknown as FileDominio,
  "equipaggiamento/avventura-02": fileEquipaggiamentoAvventura02 as unknown as FileDominio,
  "equipaggiamento/avventura-03": fileEquipaggiamentoAvventura03 as unknown as FileDominio,
  "equipaggiamento/avventura-04": fileEquipaggiamentoAvventura04 as unknown as FileDominio,
  "equipaggiamento/cavalcature-veicoli": fileEquipaggiamentoCavalcatureVeicoli as unknown as FileDominio,
  "equipaggiamento/servizi": fileEquipaggiamentoServizi as unknown as FileDominio,
  "equipaggiamento/monete": fileEquipaggiamentoMonete as unknown as FileDominio,
  "regole/incantesimi": fileRegoleIncantesimi as unknown as FileDominio,
};

export const TESTI_MANUALE: Record<string, TestiDominio> = {
  "allineamenti": testiAllineamenti as TestiDominio,
  "etichette": testiEtichette as TestiDominio,
  "regole/generali": testiRegoleGenerali as TestiDominio,
  "caratteristiche": testiCaratteristiche as TestiDominio,
  "abilita": testiAbilita as TestiDominio,
  "taglie": testiTaglie as TestiDominio,
  "lingue": testiLingue as TestiDominio,
  "condizioni": testiCondizioni as TestiDominio,
  "regole/caratteristiche": testiRegoleCaratteristiche as TestiDominio,
  "background": testiBackground as TestiDominio,
  "specie": testiSpecie as TestiDominio,
  "lignaggi": testiLignaggi as TestiDominio,
  "talenti/origini": testiTalentiOrigini as TestiDominio,
  "talenti/generali-a": testiTalentiGeneraliA as TestiDominio,
  "talenti/generali-b": testiTalentiGeneraliB as TestiDominio,
  "talenti/stili": testiTalentiStili as TestiDominio,
  "talenti/doni-epici": testiTalentiDoniEpici as TestiDominio,
  "classi/barbaro": testiClassiBarbaro as TestiDominio,
  "classi/bardo": testiClassiBardo as TestiDominio,
  "classi/chierico": testiClassiChierico as TestiDominio,
  "classi/druido": testiClassiDruido as TestiDominio,
  "classi/guerriero": testiClassiGuerriero as TestiDominio,
  "classi/ladro": testiClassiLadro as TestiDominio,
  "classi/mago": testiClassiMago as TestiDominio,
  "classi/monaco": testiClassiMonaco as TestiDominio,
  "classi/paladino": testiClassiPaladino as TestiDominio,
  "classi/ranger": testiClassiRanger as TestiDominio,
  "classi/stregone": testiClassiStregone as TestiDominio,
  "classi/warlock": testiClassiWarlock as TestiDominio,
  "equipaggiamento/armi": testiEquipaggiamentoArmi as TestiDominio,
  "regole/attacchi": testiRegoleAttacchi as TestiDominio,
  "equipaggiamento/armature": testiEquipaggiamentoArmature as TestiDominio,
  "regole/classe-armatura": testiRegoleClasseArmatura as TestiDominio,
  "equipaggiamento/strumenti": testiEquipaggiamentoStrumenti as TestiDominio,
  "equipaggiamento/avventura-01": testiEquipaggiamentoAvventura01 as TestiDominio,
  "equipaggiamento/avventura-02": testiEquipaggiamentoAvventura02 as TestiDominio,
  "equipaggiamento/avventura-03": testiEquipaggiamentoAvventura03 as TestiDominio,
  "equipaggiamento/avventura-04": testiEquipaggiamentoAvventura04 as TestiDominio,
  "equipaggiamento/cavalcature-veicoli": testiEquipaggiamentoCavalcatureVeicoli as TestiDominio,
  "equipaggiamento/servizi": testiEquipaggiamentoServizi as TestiDominio,
  "equipaggiamento/monete": testiEquipaggiamentoMonete as TestiDominio,
  "regole/incantesimi": testiRegoleIncantesimi as TestiDominio,
};
