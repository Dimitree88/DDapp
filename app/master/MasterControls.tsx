import { randomUUID } from "crypto";
import Link from "next/link";
import { spellSlots } from "@/lib/spellcasting";
import type { CreatureData } from "@/lib/creature";
import { normalizeSheet, type Sheet } from "@/lib/sheet";
import { hitDieSize, hitDiceTotal, type RestKind } from "@/lib/masterRest";
import { applyMasterCharacterAction, applyMasterCreatureAction, applyMasterGroupRest } from "./game-actions";

type CharacterEntry = { id: string; name: string; data: Sheet };
type CreatureEntry = { id: string; name: string; data: CreatureData };
type RestCharacterEntry = CharacterEntry & { isSessionParticipant: boolean };
type RestCreatureEntry = CreatureEntry & { isSessionParticipant: boolean };

const conditions = ["Accecato", "Affascinato", "Afferrato", "Assordato", "Avvelenato", "Incapacitato", "Invisibile", "Paralizzato", "Pietrificato", "Prono", "Privo di sensi", "Spaventato", "Stordito", "Trattenuto"];
const fieldClass = "min-h-10 min-w-0 rounded-lg border border-line bg-white px-2 text-sm text-ink";
const primaryButton = "min-h-10 rounded-lg bg-accent px-3 text-sm font-semibold text-white";
const secondaryButton = "min-h-10 rounded-lg border border-line px-3 text-sm font-semibold text-ink";

function ActionFields({ sessionId, character, action }: { sessionId: string; character: CharacterEntry; action: string }) {
  return <><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="characterId" value={character.id} /><input type="hidden" name="commandId" value={randomUUID()} /><input type="hidden" name="action" value={action} /></>;
}

function CharacterActionPanel({ sessionId, character: entry, party }: { sessionId: string; character: CharacterEntry; party: CharacterEntry[] }) {
  const character = { ...entry, data: normalizeSheet(entry.data) };
  const { data } = character;
  const hp = Number(data.puntiFerita);
  const tempHp = Number(data.puntiFeritaTemporanei);
  const resources = data.risorse ?? [];
  const slots = spellSlots(data).filter((slot) => slot.maximum > 0);
  const recipients = party.filter((member) => member.id !== character.id && !member.data.ispirazioneEroica);
  return <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
      <details className="rounded-lg bg-parchment/60 p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-white px-3 py-2 font-semibold text-accent">Ispirazione eroica<span aria-hidden>⌄</span></summary>
        <div className="pt-2">
        <p className="mb-2 text-sm text-ink-soft">{data.ispirazioneEroica ? "Posseduta" : "Non posseduta"}</p>
        {!data.ispirazioneEroica ? <form action={applyMasterCharacterAction} className="flex flex-wrap gap-2">
          <ActionFields sessionId={sessionId} character={character} action="ispirazione-conferisci" />
          <input name="source" aria-label="Fonte dell'Ispirazione" placeholder="Fonte (DM o regola)" className={`${fieldClass} flex-1`} />
          <button className={primaryButton}>Conferisci</button>
        </form> : <div className="flex flex-col gap-2">
          <form action={applyMasterCharacterAction} className="flex gap-2">
            <ActionFields sessionId={sessionId} character={character} action="ispirazione-spendi" />
            <input name="source" aria-label="Nota sulla spesa dell'Ispirazione" placeholder="Nota (facoltativa)" className={`${fieldClass} flex-1`} />
            <button className={secondaryButton}>Segna spesa</button>
          </form>
          {recipients.length > 0 && <form action={applyMasterCharacterAction} className="flex flex-wrap gap-2">
            <ActionFields sessionId={sessionId} character={character} action="ispirazione-conferisci" />
            <input name="source" type="hidden" value="Nuova concessione trasferita perché già posseduta" />
            <select name="targetId" aria-label="Destinatario dell'Ispirazione trasferita" required className={`${fieldClass} flex-1`} defaultValue="">
              <option value="" disabled>Trasferisci la nuova concessione a…</option>
              {recipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.name}</option>)}
            </select>
            <button className={secondaryButton}>Trasferisci</button>
          </form>}
        </div>}
        </div>
      </details>

      <details className="rounded-lg bg-parchment/60 p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-white px-3 py-2 font-semibold text-accent">Punti ferita<span aria-hidden>⌄</span></summary>
        <div className="pt-2">
        <p className="mb-2 text-sm text-ink-soft">PF {data.puntiFerita || "da registrare"} / {data.puntiFeritaMax || "da registrare"} · temporanei {data.puntiFeritaTemporanei ?? "da registrare"}</p>
        {!Number.isInteger(hp) || hp < 0 ? <form action={applyMasterCharacterAction} className="flex gap-2">
          <ActionFields sessionId={sessionId} character={character} action="pf-registra" />
          <input name="amount" type="number" min="0" max={data.puntiFeritaMax || undefined} required aria-label="Punti ferita attuali" placeholder="PF attuali" className={`${fieldClass} w-28`} />
          <button className={secondaryButton}>Registra PF</button>
        </form> : <div className="flex flex-col gap-2">
          <form action={applyMasterCharacterAction} className="flex flex-wrap gap-2">
            <ActionFields sessionId={sessionId} character={character} action="danni" />
            <input name="amount" type="number" min="1" required aria-label="Danno effettivo" placeholder="Danno già calcolato" className={`${fieldClass} flex-1`} />
            {(!Number.isInteger(tempHp) || tempHp < 0) && <input name="tempCurrent" type="number" min="0" required aria-label="PF temporanei attuali" placeholder="PF temp. attuali" className={`${fieldClass} w-28`} />}
            <label className="flex min-h-10 items-center gap-2 text-sm text-ink"><input type="checkbox" name="critical" />Critico</label>
            <input name="source" aria-label="Fonte del danno" placeholder="Fonte (facoltativa)" className={`${fieldClass} flex-1`} />
            <button className={primaryButton}>Applica danno</button>
          </form>
          <form action={applyMasterCharacterAction} className="flex gap-2">
            <ActionFields sessionId={sessionId} character={character} action="guarigione" />
            <input name="amount" type="number" min="1" required aria-label="PF recuperati" placeholder="PF recuperati" className={`${fieldClass} flex-1`} />
            <button className={secondaryButton}>Guarisci</button>
          </form>
        </div>}
        <form action={applyMasterCharacterAction} className="mt-2 flex flex-wrap gap-2">
          <ActionFields sessionId={sessionId} character={character} action="pf-temporanei" />
          <input name="amount" type="number" min="0" required aria-label="Nuovi PF temporanei" placeholder="Nuovi PF temp." className={`${fieldClass} flex-1`} />
          {Number.isInteger(tempHp) && tempHp > 0 && <><label className="flex items-center gap-1 text-xs"><input type="radio" name="choice" value="sostituisci" defaultChecked />Nuovi</label><label className="flex items-center gap-1 text-xs"><input type="radio" name="choice" value="mantieni" />Mantieni {tempHp}</label></>}
          <button className={secondaryButton}>Registra PF temp.</button>
        </form>
        {hp === 0 && data.statoMorte !== "morto" && <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-sm font-semibold text-ink">{data.statoMorte === "stabile" ? "Stabile a 0 PF" : "Tiri salvezza contro morte"} · successi {data.tiriMorte?.successi ?? "da registrare"}, fallimenti {data.tiriMorte?.fallimenti ?? "da registrare"}</p>
          {data.statoMorte !== "stabile" && <form action={applyMasterCharacterAction} className="mb-2 flex gap-2">
            <ActionFields sessionId={sessionId} character={character} action="tiro-morte" />
            <input name="amount" type="number" min="1" max="20" required aria-label="Risultato del tiro contro morte" placeholder="d20" className={`${fieldClass} w-24`} />
            <button className={secondaryButton}>Registra tiro</button>
          </form>}
          <form action={applyMasterCharacterAction}>
            <ActionFields sessionId={sessionId} character={character} action="stabilizza" />
            <button className={secondaryButton}>Segna stabilizzazione confermata</button>
          </form>
        </div>}
        </div>
      </details>

      <details className="rounded-lg bg-parchment/60 p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-white px-3 py-2 font-semibold text-accent">Stati<span aria-hidden>⌄</span></summary>
        <div className="pt-2">
        <p className="text-sm text-ink-soft">Indebolimento: {data.indebolimento ?? "da registrare"}{data.concentrazione ? ` · Concentrazione: ${data.concentrazione.effetto}` : ""}</p>
        {data.condizioni?.map((condition, index) => <div key={`${condition.nome}-${index}`} className="mt-2 flex items-center justify-between gap-2 text-sm text-ink">
          <span>{condition.nome} · {condition.fonte}{condition.durata ? ` · ${condition.durata}` : ""}</span>
          <form action={applyMasterCharacterAction}>
            <ActionFields sessionId={sessionId} character={character} action="condizione-rimuovi" />
            <input type="hidden" name="conditionIndex" value={index} />
            <button className="min-h-9 px-2 text-accent">Rimuovi</button>
          </form>
        </div>)}
        <form action={applyMasterCharacterAction} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ActionFields sessionId={sessionId} character={character} action="condizione-aggiungi" />
          <select name="condition" required defaultValue="" className={fieldClass}><option value="" disabled>Condizione…</option>{conditions.map((condition) => <option key={condition}>{condition}</option>)}</select>
          <input name="source" required placeholder="Fonte" className={fieldClass} />
          <input name="duration" placeholder="Durata (se nota)" className={fieldClass} />
          <input name="note" placeholder="Nota (facoltativa)" className={fieldClass} />
          <button className={secondaryButton}>Applica condizione</button>
        </form>
        {Number.isInteger(data.indebolimento) ? <div className="mt-2 flex gap-2">
          <form action={applyMasterCharacterAction}><ActionFields sessionId={sessionId} character={character} action="indebolimento-su" /><button className={secondaryButton}>+ Indebolimento</button></form>
          <form action={applyMasterCharacterAction}><ActionFields sessionId={sessionId} character={character} action="indebolimento-giu" /><button className={secondaryButton}>− Indebolimento</button></form>
        </div> : <form action={applyMasterCharacterAction} className="mt-2 flex gap-2">
          <ActionFields sessionId={sessionId} character={character} action="indebolimento-registra" />
          <input name="amount" type="number" min="0" max="6" required placeholder="Livello 0–6" className={`${fieldClass} w-32`} />
          <button className={secondaryButton}>Registra</button>
        </form>}
        {data.concentrazione ? <form action={applyMasterCharacterAction} className="mt-2">
          <ActionFields sessionId={sessionId} character={character} action="concentrazione-termina" /><button className={secondaryButton}>Segna concentrazione terminata</button>
        </form> : <form action={applyMasterCharacterAction} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ActionFields sessionId={sessionId} character={character} action="concentrazione-imposta" />
          <input name="effect" required placeholder="Effetto concentrato" className={fieldClass} />
          <input name="source" required placeholder="Fonte" className={fieldClass} />
          <input name="duration" placeholder="Durata (se nota)" className={fieldClass} />
          <button className={secondaryButton}>Registra concentrazione</button>
        </form>}
        </div>
      </details>

      {(resources.length > 0 || slots.length > 0) && <details className="rounded-lg bg-parchment/60 p-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg border border-line bg-white px-3 py-2 font-semibold text-accent">Risorse e slot<span aria-hidden>⌄</span></summary>
        <div className="pt-2">
        {resources.map((resource, index) => <div key={`${resource.fonte}-${resource.nome}-${index}`} className="mt-2 flex items-center justify-between gap-2 text-sm text-ink">
          <span>{resource.nome} ({resource.fonte}) · {resource.spesi}/{resource.massimo} spesi</span>
          <form action={applyMasterCharacterAction}><ActionFields sessionId={sessionId} character={character} action="risorsa-usa" /><input type="hidden" name="resourceIndex" value={index} /><button disabled={resource.spesi >= resource.massimo} className={secondaryButton}>Usa</button></form>
        </div>)}
        {slots.map((slot) => <div key={slot.level} className="mt-2 flex items-center justify-between gap-2 text-sm text-ink">
          <span>Slot livello {slot.level} · {data.slotSpesi?.[String(slot.level)] ?? "da registrare"}/{slot.maximum} spesi</span>
          <form action={applyMasterCharacterAction}><ActionFields sessionId={sessionId} character={character} action="slot-usa" /><input type="hidden" name="slotLevel" value={slot.level} /><button disabled={(data.slotSpesi?.[String(slot.level)] ?? 0) >= slot.maximum} className={secondaryButton}>Usa</button></form>
        </div>)}
        </div>
      </details>}
  </div>;
}

function CreatureActionPanel({ sessionId, creature }: { sessionId: string; creature: CreatureEntry }) {
  return <details className="mt-3 border-t border-line pt-3">
    <summary className="min-h-10 cursor-pointer list-none py-2 font-semibold text-accent">Azioni sulla creatura</summary>
    <div className="flex flex-col gap-2 pt-2">
      <form action={applyMasterCreatureAction} className="flex gap-2">
        <input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="creatureId" value={creature.id} /><input type="hidden" name="commandId" value={randomUUID()} /><input type="hidden" name="action" value="danni" />
        <input name="amount" type="number" min="1" required placeholder="Danno già calcolato" className={`${fieldClass} flex-1`} />
        <button className={primaryButton}>Danno</button>
      </form>
      <form action={applyMasterCreatureAction} className="flex gap-2">
        <input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="creatureId" value={creature.id} /><input type="hidden" name="commandId" value={randomUUID()} /><input type="hidden" name="action" value="guarigione" />
        <input name="amount" type="number" min="1" required placeholder="PF recuperati" className={`${fieldClass} flex-1`} />
        <button className={secondaryButton}>Guarisci</button>
      </form>
      <form action={applyMasterCreatureAction} className="flex gap-2">
        <input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="creatureId" value={creature.id} /><input type="hidden" name="commandId" value={randomUUID()} /><input type="hidden" name="action" value="pf-registra" />
        <input name="amount" type="number" min="0" max={creature.data.hitPointsMax} required placeholder="PF attuali" className={`${fieldClass} flex-1`} />
        <button className={secondaryButton}>Registra PF</button>
      </form>
    </div>
  </details>;
}

export function RestPanel({ sessionId, kind, characters, creatures }: { sessionId: string; kind: RestKind; characters: RestCharacterEntry[]; creatures: RestCreatureEntry[] }) {
  const label = kind === "breve" ? "Riposo breve" : "Riposo lungo";
  const selectedCharacters = characters.filter((item) => item.isSessionParticipant);
  const selectedCreatures = creatures.filter((item) => item.isSessionParticipant);
  const commandId = randomUUID();
  return <details className="rounded-xl border border-line bg-card/70 p-3">
    <summary className="min-h-11 cursor-pointer list-none py-2 font-semibold text-accent">{label}</summary>
    <form action={applyMasterGroupRest} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="commandId" value={commandId} /><input type="hidden" name="restKind" value={kind} />
      <p className="text-sm text-ink-soft">Seleziona chi ha completato il riposo. Puoi includere un solo personaggio o una parte del gruppo.</p>
      {selectedCharacters.length > 0 && <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold text-ink">Personaggi</legend>
        {selectedCharacters.map((entry) => {
          const character = normalizeSheet(entry.data);
          const count = hitDiceTotal(character);
          const die = hitDieSize(character);
          const eligibleInspirationTargets = selectedCharacters.filter((target) => target.id !== entry.id && !target.data.ispirazioneEroica);
          return <div key={entry.id} className="rounded-lg border border-line p-2">
            <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" name="character" value={entry.id} defaultChecked className="size-5 accent-accent" />{entry.name} · PF {character.puntiFerita || "da registrare"}/{character.puntiFeritaMax || "da registrare"}</label>
            {kind === "breve" && <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-ink-soft">Risultati Dadi Vita{die ? ` (d${die}, separati da virgola)` : ""}
                <input name={`hitDice-${entry.id}`} placeholder="Es. 4, 7" className={`${fieldClass} mt-1 w-full`} />
              </label>
              <label className="text-xs text-ink-soft">Dadi Vita già spesi{count ? ` (totali ${count})` : ""}
                <input name={`spentDice-${entry.id}`} type="number" min="0" max={count ?? undefined} placeholder={character.dadiVitaSpesi ?? "Da registrare se spendi dadi"} className={`${fieldClass} mt-1 w-full`} />
              </label>
            </div>}
            {kind === "lungo" && character.specie === "Umano" && character.ispirazioneEroica && eligibleInspirationTargets.length > 0 && <label className="mt-2 block text-xs text-ink-soft">Intraprendente: destinatario dell'Ispirazione aggiuntiva
              <select name={`inspirationTarget-${entry.id}`} defaultValue="" className={`${fieldClass} mt-1 w-full`}><option value="">Non trasferire</option>{eligibleInspirationTargets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select>
            </label>}
          </div>;
        })}
      </fieldset>}
      {selectedCreatures.length > 0 && <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold text-ink">Creature</legend>
        {selectedCreatures.map((creature) => <label key={creature.id} className="flex min-h-10 items-center gap-2 rounded-lg border border-line p-2 text-sm text-ink"><input type="checkbox" name="creature" value={creature.id} defaultChecked className="size-5 accent-accent" />{creature.name} · PF {creature.data.hitPointsCurrent}/{creature.data.hitPointsMax}</label>)}
      </fieldset>}
      {kind === "lungo" && <label className="flex items-start gap-2 text-sm text-ink"><input type="checkbox" name="confirm16hours" required className="mt-1 size-4 accent-accent" />Confermo che ciascun partecipante soddisfa il requisito temporale di 16 ore dall'ultimo riposo lungo.</label>}
      <label className="flex items-start gap-2 text-sm text-ink"><input type="checkbox" name="completed" required className="mt-1 size-4 accent-accent" />Confermo che il riposo è stato completato e non interrotto.</label>
      <button className={primaryButton}>Applica {label.toLocaleLowerCase("it")}</button>
    </form>
  </details>;
}

export function MasterCharacterCard({ sessionId, character, party, canAct }: { sessionId: string; character: CharacterEntry; party: CharacterEntry[]; canAct: boolean }) {
  const data = normalizeSheet(character.data);
  return <article className="rounded-xl border border-line bg-card/70 p-3">
    <div className="flex items-start justify-between gap-2">
      <div><h3 className="font-bold text-ink">{character.name}</h3><p className="text-sm text-ink-soft">{data.classe || "Classe da registrare"} · livello {data.livello || "—"}</p></div>
    </div>
    <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-ink">
      <span>PF <strong>{data.puntiFerita || "da registrare"}</strong> / {data.puntiFeritaMax || "da registrare"} · temp {data.puntiFeritaTemporanei ?? "da registrare"}</span>
      <span>CA <strong>{data.classeArmatura ?? "da registrare"}</strong></span>
    </div>
    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft"><span className="inline-flex items-center gap-1.5"><span aria-hidden className={`flex size-4 items-center justify-center rounded border ${data.ispirazioneEroica ? "border-accent bg-accent text-white" : "border-line bg-white"}`}>{data.ispirazioneEroica ? "✓" : ""}</span><span>Ispirazione eroica</span></span><span>· Indebolimento {data.indebolimento ?? "da registrare"}</span><span>· {data.condizioni?.length ? data.condizioni.map((item) => item.nome).join(", ") : "condizioni da registrare"}</span></p>
    {canAct && <CharacterActionPanel sessionId={sessionId} character={character} party={party} />}
    <Link href={`/personaggio/${character.id}`} className="mt-3 inline-block min-h-10 pt-2 text-sm font-semibold text-accent">Apri scheda ›</Link>
  </article>;
}

export function MasterCreatureCard({ sessionId, creature, canAct }: { sessionId: string; creature: CreatureEntry; canAct: boolean }) {
  return <article className="rounded-xl border border-line bg-card/70 p-3">
    <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-ink">{creature.name}</h3></div>
    <div className="mt-3 flex justify-between gap-2 text-sm text-ink"><span>PF <strong>{creature.data.hitPointsCurrent}</strong> / {creature.data.hitPointsMax}</span><span>CA <strong>{creature.data.armorClass}</strong></span></div>
    {canAct && <CreatureActionPanel sessionId={sessionId} creature={creature} />}
    <Link href={`/creatura/${creature.id}`} className="mt-3 inline-block min-h-10 pt-2 text-sm font-semibold text-accent">Apri scheda ›</Link>
  </article>;
}
