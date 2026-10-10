"use client";

import { useState } from "react";
import { speedWithExhaustion } from "./CharacterPanel";
import { useMaster } from "./MasterContext";
import { TextInput, cx } from "@/components/ui";
import { abilityName } from "@/lib/abilityNames";

const fold = (text: string) => text.toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const abbrs = ["FOR", "DES", "COS", "INT", "SAG", "CAR"];

// Consultazione rapida del gruppo: valori calcolati dalle schede, sola lettura.
export function PartyTab() {
  const { data, openPanel } = useMaster();
  const [query, setQuery] = useState("");
  const party = data.party;
  const q = fold(query.trim());
  const matches = (id: string) => {
    if (!q) return [];
    const character = party.find((item) => item.id === id)!;
    return [
      ...character.languages.filter((language) => fold(language).includes(q)).map((language) => `parla ${language}`),
      ...character.skills.filter((skill) => fold(skill.nome).includes(q)).map((skill) => `${skill.nome.toLocaleLowerCase("it")} ${skill.bonus}`),
    ];
  };
  const best = (values: { id: string; value: number }[]) => Math.max(...values.map((item) => item.value));
  const perception = party.map((item) => ({ id: item.id, value: Number(item.passivePerception || -99) }));
  const topPerception = party.length ? best(perception) : null;
  const languages = [...new Set(party.flatMap((item) => item.languages))].sort((a, b) => a.localeCompare(b, "it"));

  if (!party.length) return <p className="rounded-2xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">Nessun personaggio nella Sessione.</p>;

  return <div className="flex flex-col gap-4 pb-4">
    <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chi sa… (lingua o abilità, es. elfico, furtività)" aria-label="Cerca lingua o abilità nel gruppo" />
    {q && <ul className="flex flex-col gap-1.5">
      {party.map((item) => ({ item, found: matches(item.id) })).filter(({ found }) => found.length).map(({ item, found }) => <li key={item.id} className="rounded-xl bg-surface/80 px-3 py-2 text-sm"><strong>{item.name}</strong>: {found.join(" · ")}</li>)}
      {!party.some((item) => matches(item.id).length) && <li className="text-sm text-ink-soft">Nessuno.</li>}
    </ul>}

    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
        <thead><tr className="text-left font-sans text-[11px] uppercase tracking-wide text-ink-soft">
          <th className="sticky left-0 bg-parchment py-1.5 pr-2">Nome</th><th className="px-1.5">CA</th><th className="px-1.5">PF</th><th className="px-1.5">PP</th><th className="px-1.5">Iniz</th><th className="px-1.5">Vel</th>
          {abbrs.map((abbr) => <th key={abbr} className="px-1.5 text-center">TS {abilityName(abbr)}</th>)}<th className="px-1.5">CD inc.</th>
        </tr></thead>
        <tbody>{party.map((item) => <tr key={item.id} onClick={() => openPanel({ kind: "pg", id: item.id })} className="cursor-pointer active:bg-surface/60">
          <td className="sticky left-0 max-w-[9rem] truncate border-t border-line/50 bg-parchment py-2 pr-2 font-semibold text-ink">{item.name}</td>
          <td className="border-t border-line/50 px-1.5 font-bold">{item.ac ?? "—"}</td>
          <td className="border-t border-line/50 px-1.5">{item.hp ?? "—"}/{item.hpMax ?? "—"}</td>
          <td className={cx("border-t border-line/50 px-1.5", topPerception !== null && Number(item.passivePerception) === topPerception && "font-bold text-accent")}>{item.passivePerception || "—"}</td>
          <td className="border-t border-line/50 px-1.5">{item.initiative || "—"}</td>
          <td className="border-t border-line/50 px-1.5">{speedWithExhaustion(item).value || "—"}</td>
          {abbrs.map((abbr) => { const ability = item.abilities.find((entry) => entry.abbr === abbr); return <td key={abbr} className={cx("border-t border-line/50 px-1.5 text-center", ability?.proficient && "font-bold text-accent-strong")}>{ability?.save || "—"}</td>; })}
          <td className="border-t border-line/50 px-1.5">{item.spell?.dc ?? "—"}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="text-xs text-ink-soft">PP = Percezione passiva (in evidenza la più alta). TS in grassetto: competenza. Velocità già ridotta dall&apos;Indebolimento.</p>

    <section className="flex flex-col gap-1.5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Lingue del gruppo</h3>
      <ul className="flex flex-col gap-1 text-sm">{languages.map((language) => <li key={language}><strong>{language}</strong>: <span className="text-ink-soft">{party.filter((item) => item.languages.includes(language)).map((item) => item.name).join(", ")}</span></li>)}</ul>
    </section>
  </div>;
}
