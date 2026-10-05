"""Fase 5b: ricerca nella copia del manuale.

Uso:
  python scripts/manuale/cerca.py palla di fuoco
  python scripts/manuale/cerca.py "classe armatura" --titoli
  python scripts/manuale/cerca.py prova -c 1 -n 5

Tutti i termini devono comparire nello stesso blocco (paragrafo, voce di elenco,
riga di tabella). Maiuscole, accenti, apostrofi e trattini non contano; se non
trova nulla riprova ignorando gli spazi (es. "anti magia" trova "antimagia").
Ogni risultato riporta pagina stampata, pagina PDF e percorso di sezione.
"""
from __future__ import annotations

import argparse
import re
import sys

from comune import AUTO, INVENTARIO, VERIFICATO, leggi_json, nome_pagina, normalizza, pagina_stampata
from verifica import carica_stato


def blocchi_pagina(testo: str) -> list[dict]:
    """Divide una pagina in blocchi, tenendo traccia dei titoli interni."""
    testo = re.sub(r"<!--.*?-->", "", testo, flags=re.S)
    titoli: list[str] = []
    out = []
    for parte in re.split(r"\n\s*\n", testo):
        parte = parte.strip()
        if not parte:
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", parte)
        if m and "\n" not in parte:
            livello = len(m.group(1))
            titoli = titoli[: livello - 1] + [m.group(2).strip()]
            out.append({"testo": parte, "titoli": list(titoli), "titolo": True})
            continue
        righe = parte.splitlines()
        if all(r.startswith("|") for r in righe):
            intest = righe[0]
            for r in righe[1:] if len(righe) > 1 else righe:
                if re.match(r"^\|[\s:|-]+\|$", r):
                    continue
                out.append({"testo": f"{intest}\n{r}" if r != intest else r,
                            "titoli": list(titoli), "titolo": False})
        else:
            out.append({"testo": parte, "titoli": list(titoli), "titolo": False})
    return out


def compatto(s: str) -> str:
    return re.sub(r"[\s'\-]", "", s)


def main() -> None:
    p = argparse.ArgumentParser(description="Cerca nella copia del Manuale del Giocatore 2024")
    p.add_argument("termini", nargs="+")
    p.add_argument("-n", type=int, default=15, help="numero massimo di risultati")
    p.add_argument("-c", type=int, default=0, help="blocchi di contesto prima e dopo")
    p.add_argument("--titoli", action="store_true", help="cerca solo nei titoli")
    args = p.parse_args()

    inventario = leggi_json(INVENTARIO)
    if inventario is None:
        sys.exit("Copia assente: eseguire prima scripts/manuale/estrai.py")
    sezioni = {pg["pagina_pdf"]: pg["sezione"] for pg in inventario["pagine"]}
    verificate = {int(k) for k in carica_stato()["pagine"]}
    termini = [normalizza(t) for t in args.termini]

    pagine = []
    for n in range(1, inventario["pagine_totali"] + 1):
        file_v = VERIFICATO / f"{nome_pagina(n)}.md"
        ok = n in verificate and file_v.exists()
        testo = (file_v if ok else AUTO / f"{nome_pagina(n)}.md").read_text(encoding="utf-8")
        pagine.append((n, ok, blocchi_pagina(testo)))

    def cerca(confronto) -> list[tuple]:
        trovati = []
        for n, ok, blocchi in pagine:
            for i, b in enumerate(blocchi):
                if args.titoli and not b["titolo"]:
                    continue
                if confronto(normalizza(b["testo"])):
                    trovati.append((n, ok, blocchi, i))
        return trovati

    trovati = cerca(lambda t: all(x in t for x in termini))
    if not trovati:
        compatti = [compatto(x) for x in termini]
        trovati = cerca(lambda t: all(x in compatto(t) for x in compatti))

    # Prima i titoli (voci di incantesimi, privilegi, talenti...), poi il resto in ordine di pagina.
    trovati.sort(key=lambda t: (not t[2][t[3]]["titolo"], t[0]))
    print(f"{len(trovati)} risultati per: {' '.join(args.termini)}")
    for n, ok, blocchi, i in trovati[: args.n]:
        st = pagina_stampata(n)
        rif = f"p. {st} · PDF {n}" if st else f"PDF {n}"
        percorso = " > ".join(sezioni.get(n, []) + [t.lstrip("# ") for t in blocchi[i]["titoli"]][-2:])
        print(f"\n── {rif}{'' if ok else ' · NON VERIFICATA'} · {percorso}")
        dopo = args.c + (1 if blocchi[i]["titolo"] else 0)  # un titolo mostra il blocco che introduce
        for j in range(max(0, i - args.c), min(len(blocchi), i + dopo + 1)):
            testo = blocchi[j]["testo"]
            print(testo if len(testo) <= 1500 else testo[:1500] + " […]")
    if len(trovati) > args.n:
        print(f"\n… altri {len(trovati) - args.n} risultati (usa -n).")


if __name__ == "__main__":
    main()
