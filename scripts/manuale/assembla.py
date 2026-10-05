"""Fase 5a: assembla la copia per capitolo e l'indice per capitolo, titolo e pagina.

Uso: python scripts/manuale/assembla.py

Per ogni pagina usa la trascrizione verificata; se manca, il testo automatico
segnato come NON VERIFICATO.
"""
from __future__ import annotations

import re

from comune import (AUTO, CAPITOLI, COPIA, INVENTARIO, PDF, VERIFICATO, leggi_json,
                    nome_pagina, pagina_stampata)
from verifica import carica_stato


def slug(titolo: str) -> str:
    s = titolo.lower()
    s = re.sub(r"[àá]", "a", s)
    s = re.sub(r"[èé]", "e", s)
    s = re.sub(r"[ìí]", "i", s)
    s = re.sub(r"[òó]", "o", s)
    s = re.sub(r"[ùú]", "u", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def testo_pagina(n: int, verificate: set[int]) -> tuple[str, bool]:
    file_v = VERIFICATO / f"{nome_pagina(n)}.md"
    if file_v.exists() and n in verificate:
        return file_v.read_text(encoding="utf-8"), True
    testo = (AUTO / f"{nome_pagina(n)}.md").read_text(encoding="utf-8")
    return testo, False


def rif(n: int) -> str:
    st = pagina_stampata(n)
    return f"p. {st} (PDF {n})" if st else f"PDF {n}"


def main() -> None:
    import fitz

    inventario = leggi_json(INVENTARIO)
    stato = carica_stato()
    verificate = {int(k) for k, v in stato["pagine"].items() if v.get("stato") == "verificata"}
    totale = inventario["pagine_totali"]
    capitoli = inventario["capitoli"]
    CAPITOLI.mkdir(parents=True, exist_ok=True)
    for vecchio in CAPITOLI.glob("*.md"):
        vecchio.unlink()

    file_capitolo: dict[int, str] = {}  # pagina -> file del capitolo
    righe_indice = [
        "# Manuale del Giocatore 2024 — indice della copia verificata",
        "",
        f"Fonte: `{inventario['pdf']}` (SHA-256 `{inventario['sha256']}`).",
        "Riferimenti: pagina stampata e pagina del PDF. Ricerca: `python scripts/manuale/cerca.py <termini>`.",
        "",
        f"Pagine verificate: {len(verificate)}/{totale}.",
        "",
        "## Capitoli",
        "",
    ]
    for i, cap in enumerate(capitoli):
        da = cap["pagina_pdf"]
        a = capitoli[i + 1]["pagina_pdf"] - 1 if i + 1 < len(capitoli) else totale
        nome = f"{i:02d}-{slug(cap['titolo'])}.md"
        parti = [f"<!-- {cap['titolo']} · pagine PDF {da}-{a} -->", ""]
        non_verificate = []
        for n in range(da, a + 1):
            file_capitolo[n] = nome
            testo, ok = testo_pagina(n, verificate)
            if not ok:
                non_verificate.append(n)
            parti.append(f'<a id="{nome_pagina(n)}"></a>')
            if not ok:
                parti.append(f"> **NON VERIFICATO** — testo OCR grezzo di {rif(n)}.")
                parti.append("")
            parti.append(testo.strip())
            parti.append("")
        (CAPITOLI / nome).write_text("\n".join(parti), encoding="utf-8")
        stato_cap = "verificato" if not non_verificate else f"{a - da + 1 - len(non_verificate)}/{a - da + 1} pagine verificate"
        righe_indice.append(f"- [{cap['titolo']}](capitoli/{nome}) — {rif(da)}–{rif(a)} · {stato_cap}")

    righe_indice += ["", "## Sezioni (dai segnalibri del PDF)", ""]
    for livello, titolo, n in fitz.open(PDF).get_toc():
        if n < 1 or livello > 4:
            continue
        rientro = "  " * (livello - 1)
        destinazione = f"capitoli/{file_capitolo[n]}#{nome_pagina(n)}"
        righe_indice.append(f"{rientro}- [{titolo}]({destinazione}) — {rif(n)}")
    (COPIA / "indice.md").write_text("\n".join(righe_indice) + "\n", encoding="utf-8")
    print(f"Assemblati {len(capitoli)} capitoli; verificate {len(verificate)}/{totale} pagine.")


if __name__ == "__main__":
    main()
