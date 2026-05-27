"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useEmblaCarousel from "embla-carousel-react";
import { TextField, InlineInput, Toggle } from "@/components/fields";
import { saveSheet, unlock, lock } from "@/app/actions";
import type {
  Sheet,
  Caratteristica,
  Abilita,
} from "@/lib/sheet";

const card = "rounded-xl border border-line bg-card/70 p-4 shadow-sm";
const grid2 = "grid grid-cols-2 gap-3";
const sectionTitle =
  "mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft";

function ArrayEditor<T>({
  items,
  editable,
  onChange,
  makeNew,
  addLabel,
  renderItem,
}: {
  items: T[];
  editable: boolean;
  onChange: (items: T[]) => void;
  makeNew: () => T;
  addLabel: string;
  renderItem: (item: T, patch: (p: Partial<T>) => void, index: number) => ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && !editable && (
        <p className="text-sm text-ink-faint">Niente da mostrare.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className={card}>
          {renderItem(
            item,
            (p) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it))),
            i,
          )}
          {editable && (
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="mt-3 text-xs font-medium text-red-800"
            >
              Rimuovi
            </button>
          )}
        </div>
      ))}
      {editable && (
        <button
          type="button"
          onClick={() => onChange([...items, makeNew()])}
          className="rounded-lg border border-dashed border-line px-4 py-3 text-sm font-medium text-ink-soft active:bg-card/60"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}

const COINS: [string, keyof Sheet["monete"]][] = [
  ["Rame", "rame"],
  ["Argento", "argento"],
  ["Electrum", "electrum"],
  ["Oro", "oro"],
  ["Platino", "platino"],
];

export default function CharacterClient({
  id,
  name: initialName,
  sheet: initialSheet,
  canEdit,
}: {
  id: string;
  name: string;
  sheet: Sheet;
  canEdit: boolean;
}) {
  const router = useRouter();
  const editable = canEdit;

  const [sheet, setSheet] = useState<Sheet>(initialSheet);
  const [name, setName] = useState(initialName);
  const [dirty, setDirty] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start" });
  const [selected, setSelected] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const patch = (p: Partial<Sheet>) => {
    setSheet((s) => ({ ...s, ...p }));
    setDirty(true);
  };
  const updateName = (v: string) => {
    setName(v);
    setDirty(true);
  };
  const updateCar = (i: number, p: Partial<Caratteristica>) => {
    setSheet((s) => ({
      ...s,
      caratteristiche: s.caratteristiche.map((c, idx) => (idx === i ? { ...c, ...p } : c)),
    }));
    setDirty(true);
  };
  const updateAbi = (i: number, p: Partial<Abilita>) => {
    setSheet((s) => ({
      ...s,
      abilita: s.abilita.map((a, idx) => (idx === i ? { ...a, ...p } : a)),
    }));
    setDirty(true);
  };

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const res = await saveSheet(id, name, sheet);
    setSaving(false);
    if (res.ok) setDirty(false);
    else setSaveError(res.error ?? "Errore nel salvataggio.");
  }

  async function handleUnlock() {
    setUnlocking(true);
    setPinError(null);
    const res = await unlock(id, pin);
    setUnlocking(false);
    if (res.ok) {
      setShowPin(false);
      setPin("");
      router.refresh();
    } else {
      setPinError(res.error ?? "Errore.");
    }
  }

  async function handleLock() {
    if (dirty && !confirm("Ci sono modifiche non salvate. Bloccare comunque?")) return;
    await lock(id);
    router.refresh();
  }

  const pages: { title: string; body: ReactNode }[] = [
    {
      title: "Stato",
      body: (
        <div className="flex flex-col gap-4">
          <TextField label="Nome personaggio" value={name} onChange={updateName} editable={editable} />
          <div className={grid2}>
            <TextField label="Livello" value={sheet.livello} onChange={(v) => patch({ livello: v })} editable={editable} />
            <TextField label="Classe" value={sheet.classe} onChange={(v) => patch({ classe: v })} editable={editable} />
          </div>
          <div className={grid2}>
            <TextField label="Punti Ferita" value={sheet.puntiFerita} onChange={(v) => patch({ puntiFerita: v })} editable={editable} />
            <TextField label="PF Massimi" value={sheet.puntiFeritaMax} onChange={(v) => patch({ puntiFeritaMax: v })} editable={editable} />
          </div>
          <TextField label="Classe Armatura" value={sheet.classeArmatura} onChange={(v) => patch({ classeArmatura: v })} editable={editable} />
          <div className={grid2}>
            <TextField label="Scudo" value={sheet.scudo} onChange={(v) => patch({ scudo: v })} editable={editable} />
            <TextField label="Iniziativa" value={sheet.iniziativa} onChange={(v) => patch({ iniziativa: v })} editable={editable} />
          </div>
          <div className={grid2}>
            <TextField label="Bonus Competenza" value={sheet.bonusCompetenza} onChange={(v) => patch({ bonusCompetenza: v })} editable={editable} />
            <TextField label="Percezione Passiva" value={sheet.percezionePassiva} onChange={(v) => patch({ percezionePassiva: v })} editable={editable} />
          </div>
          <div className={grid2}>
            <TextField label="Dadi Vita" value={sheet.dadiVita} onChange={(v) => patch({ dadiVita: v })} editable={editable} />
            <TextField label="Punti Esperienza" value={sheet.puntiEsperienza} onChange={(v) => patch({ puntiEsperienza: v })} editable={editable} />
          </div>
          <TextField label="Ispirazione Eroica" value={sheet.ispirazioneEroica} onChange={(v) => patch({ ispirazioneEroica: v })} editable={editable} />
        </div>
      ),
    },
    {
      title: "Identità",
      body: (
        <div className="flex flex-col gap-4">
          <TextField label="Specie" value={sheet.specie} onChange={(v) => patch({ specie: v })} editable={editable} multiline />
          <TextField label="Background" value={sheet.background} onChange={(v) => patch({ background: v })} editable={editable} multiline />
          <div className={grid2}>
            <TextField label="Allineamento" value={sheet.allineamento} onChange={(v) => patch({ allineamento: v })} editable={editable} />
            <TextField label="Taglia" value={sheet.taglia} onChange={(v) => patch({ taglia: v })} editable={editable} />
          </div>
          <TextField label="Velocità" value={sheet.velocita} onChange={(v) => patch({ velocita: v })} editable={editable} />
          <TextField label="Lingue" value={sheet.lingue} onChange={(v) => patch({ lingue: v })} editable={editable} multiline />
        </div>
      ),
    },
    {
      title: "Caratteristiche",
      body: (
        <div className="flex flex-col gap-3">
          {sheet.caratteristiche.map((c, i) => (
            <div key={c.abbr} className={card}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-base font-bold text-accent">{c.nome}</span>
                <Toggle
                  label="Tiro salvezza"
                  checked={c.tsCompetente}
                  onChange={(v) => updateCar(i, { tsCompetente: v })}
                  editable={editable}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["Valore", "valore"],
                    ["Mod.", "modificatore"],
                    ["T. Salvezza", "tsBonus"],
                  ] as [string, keyof Caratteristica][]
                ).map(([lab, key]) => (
                  <div key={key}>
                    <span className="mb-1 block text-center text-[10px] uppercase text-ink-faint">
                      {lab}
                    </span>
                    <InlineInput
                      value={String(c[key])}
                      onChange={(v) => updateCar(i, { [key]: v } as Partial<Caratteristica>)}
                      editable={editable}
                      className="w-full text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Abilità",
      body: (
        <div className="flex flex-col gap-2">
          {sheet.abilita.map((a, i) => (
            <div key={a.nome} className="rounded-lg border border-line bg-card/70 p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Toggle label="" checked={a.competente} onChange={(v) => updateAbi(i, { competente: v })} editable={editable} />
                <div className="flex-1 leading-tight">
                  <div className="font-medium">{a.nome}</div>
                  <div className="text-xs text-ink-faint">{a.caratteristica}</div>
                </div>
                <InlineInput value={a.bonus} onChange={(v) => updateAbi(i, { bonus: v })} editable={editable} className="w-16 text-center" placeholder="±" />
              </div>
              {(editable || a.note) && (
                <div className="mt-2">
                  <InlineInput value={a.note} onChange={(v) => updateAbi(i, { note: v })} editable={editable} className="w-full text-sm text-ink-soft" placeholder="note (es. da Ranger)" />
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Armi",
      body: (
        <div className="flex flex-col gap-5">
          <TextField label="Competenze armi" value={sheet.competenzeArmi} onChange={(v) => patch({ competenzeArmi: v })} editable={editable} placeholder="es. Semplici, Da guerra" />
          <div>
            <h3 className={sectionTitle}>Armi</h3>
            <ArrayEditor
              items={sheet.armi}
              editable={editable}
              onChange={(items) => patch({ armi: items })}
              makeNew={() => ({ nome: "", quantita: "", bonus: "", danno: "", gittata: "", provenienza: "", note: "" })}
              addLabel="Aggiungi arma"
              renderItem={(a, p) => (
                <div className="flex flex-col gap-2">
                  <TextField label="Nome" value={a.nome} onChange={(v) => p({ nome: v })} editable={editable} />
                  <div className={grid2}>
                    <TextField label="Quantità" value={a.quantita} onChange={(v) => p({ quantita: v })} editable={editable} />
                    <TextField label="Bonus att./CD" value={a.bonus} onChange={(v) => p({ bonus: v })} editable={editable} />
                  </div>
                  <TextField label="Danno e tipo" value={a.danno} onChange={(v) => p({ danno: v })} editable={editable} />
                  <TextField label="Gittata" value={a.gittata} onChange={(v) => p({ gittata: v })} editable={editable} />
                  <TextField label="Provenienza" value={a.provenienza} onChange={(v) => p({ provenienza: v })} editable={editable} />
                  <TextField label="Note" value={a.note} onChange={(v) => p({ note: v })} editable={editable} multiline />
                </div>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Equipaggiamento",
      body: (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className={sectionTitle}>Competenze armatura</h3>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Leggere", "leggere"],
                  ["Medie", "medie"],
                  ["Pesanti", "pesanti"],
                  ["Scudi", "scudi"],
                ] as [string, keyof Sheet["competenzeArmatura"]][]
              ).map(([lab, key]) => (
                <Toggle
                  key={key}
                  label={lab}
                  checked={sheet.competenzeArmatura[key]}
                  onChange={(v) => patch({ competenzeArmatura: { ...sheet.competenzeArmatura, [key]: v } })}
                  editable={editable}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className={sectionTitle}>Oggetti</h3>
            <ArrayEditor
              items={sheet.equipaggiamento}
              editable={editable}
              onChange={(items) => patch({ equipaggiamento: items })}
              makeNew={() => ({ nome: "", dettaglio: "", provenienza: "" })}
              addLabel="Aggiungi oggetto"
              renderItem={(e, p) => (
                <div className="flex flex-col gap-2">
                  <TextField label="Oggetto" value={e.nome} onChange={(v) => p({ nome: v })} editable={editable} />
                  <TextField label="Dettaglio" value={e.dettaglio} onChange={(v) => p({ dettaglio: v })} editable={editable} multiline />
                  <TextField label="Provenienza" value={e.provenienza} onChange={(v) => p({ provenienza: v })} editable={editable} />
                </div>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Privilegi",
      body: (
        <ArrayEditor
          items={sheet.privilegi}
          editable={editable}
          onChange={(items) => patch({ privilegi: items })}
          makeNew={() => ({ titolo: "", descrizione: "" })}
          addLabel="Aggiungi privilegio"
          renderItem={(pr, p) => (
            <div className="flex flex-col gap-2">
              <TextField label="Titolo" value={pr.titolo} onChange={(v) => p({ titolo: v })} editable={editable} />
              <TextField label="Descrizione" value={pr.descrizione} onChange={(v) => p({ descrizione: v })} editable={editable} multiline />
            </div>
          )}
        />
      ),
    },
    {
      title: "Talenti",
      body: (
        <ArrayEditor
          items={sheet.talenti}
          editable={editable}
          onChange={(items) => patch({ talenti: items })}
          makeNew={() => ({ nome: "", descrizione: "" })}
          addLabel="Aggiungi talento"
          renderItem={(t, p) => (
            <div className="flex flex-col gap-2">
              <TextField label="Nome" value={t.nome} onChange={(v) => p({ nome: v })} editable={editable} />
              <TextField label="Descrizione" value={t.descrizione} onChange={(v) => p({ descrizione: v })} editable={editable} multiline />
            </div>
          )}
        />
      ),
    },
    {
      title: "Incantesimi",
      body: (
        <ArrayEditor
          items={sheet.incantesimi}
          editable={editable}
          onChange={(items) => patch({ incantesimi: items })}
          makeNew={() => ({ livello: "", nome: "", tempo: "", gittata: "", componenti: "", durata: "", crm: "", note: "" })}
          addLabel="Aggiungi incantesimo"
          renderItem={(inc, p) => (
            <div className="flex flex-col gap-2">
              <div className={grid2}>
                <TextField label="Livello" value={inc.livello} onChange={(v) => p({ livello: v })} editable={editable} />
                <TextField label="C / R / M" value={inc.crm} onChange={(v) => p({ crm: v })} editable={editable} />
              </div>
              <TextField label="Nome" value={inc.nome} onChange={(v) => p({ nome: v })} editable={editable} />
              <div className={grid2}>
                <TextField label="Tempo di lancio" value={inc.tempo} onChange={(v) => p({ tempo: v })} editable={editable} />
                <TextField label="Gittata" value={inc.gittata} onChange={(v) => p({ gittata: v })} editable={editable} />
              </div>
              <div className={grid2}>
                <TextField label="Componenti" value={inc.componenti} onChange={(v) => p({ componenti: v })} editable={editable} />
                <TextField label="Durata" value={inc.durata} onChange={(v) => p({ durata: v })} editable={editable} />
              </div>
              <TextField label="Note" value={inc.note} onChange={(v) => p({ note: v })} editable={editable} multiline />
            </div>
          )}
        />
      ),
    },
    {
      title: "Monete & Note",
      body: (
        <div className="flex flex-col gap-5">
          <div>
            <h3 className={sectionTitle}>Monete</h3>
            <div className="flex flex-col gap-2">
              {COINS.map(([lab, key]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-line bg-card/70 px-3 py-2 shadow-sm"
                >
                  <span className="text-sm text-ink-soft">{lab}</span>
                  <InlineInput
                    value={sheet.monete[key]}
                    onChange={(v) => patch({ monete: { ...sheet.monete, [key]: v } })}
                    editable={editable}
                    className="w-24 text-right"
                  />
                </div>
              ))}
            </div>
          </div>
          <TextField label="Note libere" value={sheet.note} onChange={(v) => patch({ note: v })} editable={editable} multiline />
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-dvh flex-col">
      <header className="shrink-0 border-b border-line bg-parchment/90 px-4 pb-3 pt-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-ink-soft">
            ‹ Compagnia
          </Link>
          <div className="flex items-center gap-2">
            {editable ? (
              <>
                <span className="text-xs text-green-800">
                  {dirty ? "Non salvato" : "Modifica attiva"}
                </span>
                <button
                  type="button"
                  onClick={handleLock}
                  className="rounded-md border border-line px-2 py-1 text-xs text-ink-soft"
                >
                  Blocca
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowPin(true)}
                className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-parchment"
              >
                Modifica
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="truncate text-lg font-bold text-ink">
            {name || "Senza nome"}
          </h1>
          <span className="ml-2 shrink-0 text-xs text-ink-faint">
            {pages[selected]?.title}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {pages.map((p, i) => (
            <button
              key={i}
              type="button"
              aria-label={p.title}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === selected ? "w-5 bg-accent" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {pages.map((p, i) => (
            <div
              key={i}
              className="no-scrollbar h-full min-w-0 flex-[0_0_100%] overflow-y-auto px-5 pb-10 pt-4"
            >
              {p.body}
            </div>
          ))}
        </div>
      </div>

      {editable && (
        <div className="shrink-0 border-t border-line bg-parchment/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="w-full rounded-lg bg-accent py-3 font-semibold text-parchment transition-opacity disabled:opacity-40"
          >
            {saving ? "Salvataggio…" : dirty ? "Salva modifiche" : "Tutto salvato"}
          </button>
          {saveError && (
            <p className="mt-2 text-center text-sm text-red-800">{saveError}</p>
          )}
        </div>
      )}

      {showPin && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => setShowPin(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-accent">Sblocca per modificare</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Inserisci il PIN a 4 cifre di questo personaggio.
            </p>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              autoFocus
              className="mt-4 w-full rounded-lg border border-line bg-card/80 px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink focus:border-accent focus:outline-none"
              placeholder="••••"
            />
            {pinError && <p className="mt-2 text-sm text-red-800">{pinError}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPin(false)}
                className="flex-1 rounded-lg border border-line py-3 text-ink-soft"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleUnlock}
                disabled={unlocking || pin.length !== 4}
                className="flex-1 rounded-lg bg-accent py-3 font-semibold text-parchment disabled:opacity-40"
              >
                {unlocking ? "…" : "Sblocca"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
