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
import fileIncantesimiI001 from "./incantesimi/I0-01.json";
import testiIncantesimiI001 from "./testi/incantesimi/I0-01.json";
import fileIncantesimiI002 from "./incantesimi/I0-02.json";
import testiIncantesimiI002 from "./testi/incantesimi/I0-02.json";
import fileIncantesimiI101 from "./incantesimi/I1-01.json";
import testiIncantesimiI101 from "./testi/incantesimi/I1-01.json";
import fileIncantesimiI102 from "./incantesimi/I1-02.json";
import testiIncantesimiI102 from "./testi/incantesimi/I1-02.json";
import fileIncantesimiI103 from "./incantesimi/I1-03.json";
import testiIncantesimiI103 from "./testi/incantesimi/I1-03.json";
import fileIncantesimiI104 from "./incantesimi/I1-04.json";
import testiIncantesimiI104 from "./testi/incantesimi/I1-04.json";
import fileIncantesimiI201 from "./incantesimi/I2-01.json";
import testiIncantesimiI201 from "./testi/incantesimi/I2-01.json";
import fileIncantesimiI202 from "./incantesimi/I2-02.json";
import testiIncantesimiI202 from "./testi/incantesimi/I2-02.json";
import fileIncantesimiI203 from "./incantesimi/I2-03.json";
import testiIncantesimiI203 from "./testi/incantesimi/I2-03.json";
import fileIncantesimiI204 from "./incantesimi/I2-04.json";
import testiIncantesimiI204 from "./testi/incantesimi/I2-04.json";
import fileIncantesimiI301 from "./incantesimi/I3-01.json";
import testiIncantesimiI301 from "./testi/incantesimi/I3-01.json";
import fileIncantesimiI302 from "./incantesimi/I3-02.json";
import testiIncantesimiI302 from "./testi/incantesimi/I3-02.json";
import fileIncantesimiI303 from "./incantesimi/I3-03.json";
import testiIncantesimiI303 from "./testi/incantesimi/I3-03.json";
import fileIncantesimiI401 from "./incantesimi/I4-01.json";
import testiIncantesimiI401 from "./testi/incantesimi/I4-01.json";
import fileIncantesimiI402 from "./incantesimi/I4-02.json";
import testiIncantesimiI402 from "./testi/incantesimi/I4-02.json";
import fileIncantesimiI403 from "./incantesimi/I4-03.json";
import testiIncantesimiI403 from "./testi/incantesimi/I4-03.json";
import fileIncantesimiI501 from "./incantesimi/I5-01.json";
import testiIncantesimiI501 from "./testi/incantesimi/I5-01.json";
import fileIncantesimiI502 from "./incantesimi/I5-02.json";
import testiIncantesimiI502 from "./testi/incantesimi/I5-02.json";
import fileIncantesimiI503 from "./incantesimi/I5-03.json";
import testiIncantesimiI503 from "./testi/incantesimi/I5-03.json";
import fileIncantesimiI601 from "./incantesimi/I6-01.json";
import testiIncantesimiI601 from "./testi/incantesimi/I6-01.json";
import fileIncantesimiI602 from "./incantesimi/I6-02.json";
import testiIncantesimiI602 from "./testi/incantesimi/I6-02.json";
import fileIncantesimiI701 from "./incantesimi/I7-01.json";
import testiIncantesimiI701 from "./testi/incantesimi/I7-01.json";
import fileIncantesimiI702 from "./incantesimi/I7-02.json";
import testiIncantesimiI702 from "./testi/incantesimi/I7-02.json";
import fileIncantesimiI801 from "./incantesimi/I8-01.json";
import testiIncantesimiI801 from "./testi/incantesimi/I8-01.json";
import fileIncantesimiI901 from "./incantesimi/I9-01.json";
import testiIncantesimiI901 from "./testi/incantesimi/I9-01.json";

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
  "incantesimi/I0-01": fileIncantesimiI001 as unknown as FileDominio,
  "incantesimi/I0-02": fileIncantesimiI002 as unknown as FileDominio,
  "incantesimi/I1-01": fileIncantesimiI101 as unknown as FileDominio,
  "incantesimi/I1-02": fileIncantesimiI102 as unknown as FileDominio,
  "incantesimi/I1-03": fileIncantesimiI103 as unknown as FileDominio,
  "incantesimi/I1-04": fileIncantesimiI104 as unknown as FileDominio,
  "incantesimi/I2-01": fileIncantesimiI201 as unknown as FileDominio,
  "incantesimi/I2-02": fileIncantesimiI202 as unknown as FileDominio,
  "incantesimi/I2-03": fileIncantesimiI203 as unknown as FileDominio,
  "incantesimi/I2-04": fileIncantesimiI204 as unknown as FileDominio,
  "incantesimi/I3-01": fileIncantesimiI301 as unknown as FileDominio,
  "incantesimi/I3-02": fileIncantesimiI302 as unknown as FileDominio,
  "incantesimi/I3-03": fileIncantesimiI303 as unknown as FileDominio,
  "incantesimi/I4-01": fileIncantesimiI401 as unknown as FileDominio,
  "incantesimi/I4-02": fileIncantesimiI402 as unknown as FileDominio,
  "incantesimi/I4-03": fileIncantesimiI403 as unknown as FileDominio,
  "incantesimi/I5-01": fileIncantesimiI501 as unknown as FileDominio,
  "incantesimi/I5-02": fileIncantesimiI502 as unknown as FileDominio,
  "incantesimi/I5-03": fileIncantesimiI503 as unknown as FileDominio,
  "incantesimi/I6-01": fileIncantesimiI601 as unknown as FileDominio,
  "incantesimi/I6-02": fileIncantesimiI602 as unknown as FileDominio,
  "incantesimi/I7-01": fileIncantesimiI701 as unknown as FileDominio,
  "incantesimi/I7-02": fileIncantesimiI702 as unknown as FileDominio,
  "incantesimi/I8-01": fileIncantesimiI801 as unknown as FileDominio,
  "incantesimi/I9-01": fileIncantesimiI901 as unknown as FileDominio,
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
  "incantesimi/I0-01": testiIncantesimiI001 as TestiDominio,
  "incantesimi/I0-02": testiIncantesimiI002 as TestiDominio,
  "incantesimi/I1-01": testiIncantesimiI101 as TestiDominio,
  "incantesimi/I1-02": testiIncantesimiI102 as TestiDominio,
  "incantesimi/I1-03": testiIncantesimiI103 as TestiDominio,
  "incantesimi/I1-04": testiIncantesimiI104 as TestiDominio,
  "incantesimi/I2-01": testiIncantesimiI201 as TestiDominio,
  "incantesimi/I2-02": testiIncantesimiI202 as TestiDominio,
  "incantesimi/I2-03": testiIncantesimiI203 as TestiDominio,
  "incantesimi/I2-04": testiIncantesimiI204 as TestiDominio,
  "incantesimi/I3-01": testiIncantesimiI301 as TestiDominio,
  "incantesimi/I3-02": testiIncantesimiI302 as TestiDominio,
  "incantesimi/I3-03": testiIncantesimiI303 as TestiDominio,
  "incantesimi/I4-01": testiIncantesimiI401 as TestiDominio,
  "incantesimi/I4-02": testiIncantesimiI402 as TestiDominio,
  "incantesimi/I4-03": testiIncantesimiI403 as TestiDominio,
  "incantesimi/I5-01": testiIncantesimiI501 as TestiDominio,
  "incantesimi/I5-02": testiIncantesimiI502 as TestiDominio,
  "incantesimi/I5-03": testiIncantesimiI503 as TestiDominio,
  "incantesimi/I6-01": testiIncantesimiI601 as TestiDominio,
  "incantesimi/I6-02": testiIncantesimiI602 as TestiDominio,
  "incantesimi/I7-01": testiIncantesimiI701 as TestiDominio,
  "incantesimi/I7-02": testiIncantesimiI702 as TestiDominio,
  "incantesimi/I8-01": testiIncantesimiI801 as TestiDominio,
  "incantesimi/I9-01": testiIncantesimiI901 as TestiDominio,
};
