"""Fase 4: rendering delle pagine, controlli automatici e registro delle verifiche.

Comandi:
  python scripts/manuale/verifica.py rendi [da a]      PNG delle pagine per il confronto visivo
  python scripts/manuale/verifica.py controlla N...    confronta verificato/ con il testo OCR
  python scripts/manuale/verifica.py segna N... [--nota "..."]
                                                       registra le pagine come verificate
  python scripts/manuale/verifica.py stato             riepilogo e pagine da riverificare
  python scripts/manuale/verifica.py correzioni        rigenera i diff auto -> verificato

Una pagina è verificata solo dopo il confronto con la pagina renderizzata del PDF.
Il registro (stato-verifica.json) contiene hash e note, mai testo del manuale.
"""
from __future__ import annotations

import argparse
import datetime as dt
import difflib
import re
import sys

from comune import (AUTO, CORREZIONI, COPIA, PDF, PDF_SHA256, STATO, VERIFICATO,
                    leggi_json, nome_pagina, normalizza, scrivi_json, sha256_file)

RENDER = COPIA / "render"
DPI_RENDER = 144
TOTALE_PAGINE = 390


def carica_stato() -> dict:
    return leggi_json(STATO, {"pdf_sha256": PDF_SHA256, "pagine": {}})


def compatto(testo: str) -> str:
    """Solo lettere e cifre, senza accenti e markup: gli spazi OCR non contano.

    L'OCR confonde 1/l/I e 0/O: nel confronto sono equivalenti.
    """
    testo = re.sub(r"<!--.*?-->", " ", testo, flags=re.S)
    testo = normalizza(testo)
    testo = testo.translate(str.maketrans({"l": "1", "i": "1", "o": "0"}))
    return re.sub(r"[^0-9a-z]", "", testo)


def controlla(n: int) -> bool:
    nome = nome_pagina(n)
    file_v = VERIFICATO / f"{nome}.md"
    if not file_v.exists():
        print(f"{nome}: manca verificato/{nome}.md")
        return False
    v = file_v.read_text(encoding="utf-8")
    a = (AUTO / f"{nome}.md").read_text(encoding="utf-8")
    ok = True
    if not v.startswith(f"<!-- pagina PDF {n}"):
        print(f"{nome}: intestazione di pagina mancante o errata")
        ok = False
    if re.search(r"\?\?|TODO|DA VERIFICARE", v):
        print(f"{nome}: contiene marcatori di dubbio aperti")
        ok = False
    ca, cv = compatto(a), compatto(v)
    sm = difflib.SequenceMatcher(None, ca, cv, autojunk=False)
    diff = [op for op in sm.get_opcodes() if op[0] != "equal"]
    tolti = sum(i2 - i1 for op, i1, i2, _, _ in diff if op in ("delete", "replace"))
    print(f"{nome}: caratteri OCR {len(ca)}, verificati {len(cv)}, "
          f"somiglianza {sm.ratio():.3f}, differenze {len(diff)}")
    for op, i1, i2, j1, j2 in diff[:80]:
        print(f"  {ca[max(0, i1 - 6):i1]}[{ca[i1:i2]} → {cv[j1:j2]}]{ca[i2:i2 + 6]}")
    if len(diff) > 80:
        print(f"  … altre {len(diff) - 80} differenze")
    if tolti > 0.1 * max(len(ca), 1):
        print("  ATTENZIONE: molto testo OCR non ritrovato, possibile omissione")
        ok = False
    return ok


def segna(pagine: list[int], nota: str | None) -> None:
    stato = carica_stato()
    oggi = dt.date.today().isoformat()
    for n in pagine:
        nome = nome_pagina(n)
        file_v = VERIFICATO / f"{nome}.md"
        if not file_v.exists():
            sys.exit(f"{nome}: impossibile segnare, manca la trascrizione verificata")
        voce = {
            "stato": "verificata",
            "data": oggi,
            "sha256_verificato": sha256_file(file_v),
            "sha256_auto": sha256_file(AUTO / f"{nome}.md"),
        }
        if nota:
            voce["nota"] = nota
        stato["pagine"][str(n)] = voce
    stato["pdf_sha256"] = PDF_SHA256
    stato["pagine"] = dict(sorted(stato["pagine"].items(), key=lambda kv: int(kv[0])))
    scrivi_json(STATO, stato)
    print(f"Segnate {len(pagine)} pagine. Verificate: {len(stato['pagine'])}/{TOTALE_PAGINE}")


def riepilogo() -> None:
    stato = carica_stato()
    verificate, cambiate, mancanti = [], [], []
    for n in range(1, TOTALE_PAGINE + 1):
        voce = stato["pagine"].get(str(n))
        nome = nome_pagina(n)
        if not voce:
            mancanti.append(n)
            continue
        file_v = VERIFICATO / f"{nome}.md"
        if not file_v.exists() or sha256_file(file_v) != voce["sha256_verificato"]:
            cambiate.append(n)  # trascrizione modificata o assente dopo la verifica
        else:
            verificate.append(n)
    print(f"PDF atteso {PDF_SHA256[:12]}…, registro {stato.get('pdf_sha256', '')[:12]}…")
    print(f"Verificate {len(verificate)}/{TOTALE_PAGINE}")
    if cambiate:
        print("Da riverificare (file cambiato o assente):", compatta(cambiate))
    if mancanti:
        print("Non ancora verificate:", compatta(mancanti))


def compatta(numeri: list[int]) -> str:
    out, inizio, prec = [], None, None
    for n in numeri + [None]:
        if inizio is None:
            inizio = prec = n
        elif n is not None and n == prec + 1:
            prec = n
        else:
            out.append(str(inizio) if inizio == prec else f"{inizio}-{prec}")
            inizio = prec = n
    return ", ".join(out)


def rendi(da: int, a: int) -> None:
    import fitz
    RENDER.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    for n in range(da, a + 1):
        doc[n - 1].get_pixmap(dpi=DPI_RENDER).save(RENDER / f"{nome_pagina(n)}.png")
    print(f"Renderizzate pagine {da}-{a} in {RENDER}")


def ingrandisci(n: int, alto: float, basso: float, sinistra: float = 0, destra: float = 1) -> None:
    """Ritaglio ad alta risoluzione di una fascia di pagina (frazioni 0-1)."""
    import fitz
    pagina = fitz.open(PDF)[n - 1]
    r = pagina.rect
    clip = fitz.Rect(r.width * sinistra, r.height * alto, r.width * destra, r.height * basso)
    uscita = RENDER / f"{nome_pagina(n)}-zoom.png"
    pagina.get_pixmap(dpi=260, clip=clip).save(uscita)
    print(uscita)


def correzioni() -> None:
    CORREZIONI.mkdir(parents=True, exist_ok=True)
    conta = 0
    for file_v in sorted(VERIFICATO.glob("p*.md")):
        a = (AUTO / file_v.name).read_text(encoding="utf-8").splitlines(keepends=True)
        v = file_v.read_text(encoding="utf-8").splitlines(keepends=True)
        diff = difflib.unified_diff(a, v, f"auto/{file_v.name}", f"verificato/{file_v.name}")
        (CORREZIONI / f"{file_v.stem}.diff").write_text("".join(diff), encoding="utf-8")
        conta += 1
    print(f"Rigenerati {conta} diff in {CORREZIONI}")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("comando", choices=["rendi", "controlla", "segna", "stato", "correzioni", "zoom"])
    p.add_argument("pagine", nargs="*", type=float)
    p.add_argument("--nota")
    args = p.parse_args()
    if args.comando == "zoom":
        n, *fasce = args.pagine
        ingrandisci(int(n), *fasce)
        return
    args.pagine = [int(x) for x in args.pagine]
    if args.comando == "rendi":
        da, a = (args.pagine + [1, TOTALE_PAGINE])[:2] if not args.pagine else (args.pagine[0], args.pagine[-1])
        rendi(da, a)
    elif args.comando == "controlla":
        esiti = [controlla(n) for n in args.pagine]
        sys.exit(0 if all(esiti) else 1)
    elif args.comando == "segna":
        segna(args.pagine, args.nota)
    elif args.comando == "stato":
        riepilogo()
    else:
        correzioni()


if __name__ == "__main__":
    main()
