"""Fasi 1-2: inventario del PDF, estrazione grezza con coordinate e ricostruzione automatica.

Uso: python scripts/manuale/estrai.py [pagina_iniziale pagina_finale]

Rigenera solo `grezzo/`, `auto/` e `inventario.json`: la cartella `verificato/`
non viene mai toccata.
"""
from __future__ import annotations

import collections
import re
import sys

import fitz  # PyMuPDF

from comune import (AUTO, GREZZO, INVENTARIO, PDF, PDF_SHA256, nome_pagina,
                    pagina_stampata, scrivi_json, sha256_file)

PIE_DI_PAGINA_Y = 728   # sotto questa quota c'è solo il piè di pagina
SCARTO_COLONNA = 8      # tolleranza sul centro pagina per assegnare la colonna
SPAZIO_CELLA = 7        # distanza orizzontale che separa celle di una tabella
SOGLIA_TITOLO = 9.6     # corpo minimo dei titoli (testo corrente 8,4-9,2)

# Confusioni tipiche dell'OCR nei numeri; la verifica visiva resta necessaria.
CORREZIONI_OCR = [
    (re.compile(r"(?<![\w'’])l(?=d\d)"), "1"),             # ld20 -> 1d20
    (re.compile(r"(?<=\d)[lI](?=\d)"), "1"),                # 1l -> 11
    (re.compile(r"(?<![\w'’])[lI](?=\d)"), "1"),            # l5 -> 15
    (re.compile(r"(?<=\d)[lI](?![\w'’])"), "1"),            # 2l -> 21
    (re.compile(r"(?<=[+\-–])[lI](?![\w'’])"), "1"),        # +l -> +1
    (re.compile(r"(?<=[+\-–])O(?![\w'’])"), "0"),           # +O -> 0
    (re.compile(r"(?<=\d)O|O(?=\d)"), "0"),                 # 1O -> 10
    (re.compile(r"^[lI]$"), "1"),                            # cella "l" -> 1
    (re.compile(r"\b(?:[lI]|\d+)?d(?=[0-9lI])[0-9lIOoS]+\b"),
     lambda m: m.group(0).split("d", 1)[0].replace("l", "1").replace("I", "1") + "d"
     + m.group(0).split("d", 1)[1].translate(str.maketrans("lIOoS", "11005"))),  # ldlO -> 1d10
    (re.compile(r"(?<=[+\-–])S\b|(?<=\d)S\b|\bS(?=\d)"), "5"),        # +S, 2S -> 5
    (re.compile(r"\bS(?= (?:mo|ma|mr|me|kg|m|metri|anni)\b)"), "5"),     # S mo -> 5 mo
    (re.compile(r"\bSO(?= (?:mo|ma|mr|me|kg|m|metri|anni)\b)"), "50"),   # SO anni -> 50
    (re.compile(r"(?<=\b[ad] )O(?=[\s,.;:)]|$)|(?<=\bd[ia] )O(?=[\s,.;:)]|$)"), "0"),  # a O -> a 0
    (re.compile(r"\bl(?=[bcdfghjkmnpqrstvwxz][a-zàèéìòù])"), "I"),      # lsmark -> Ismark
    (re.compile(r"(?<=\bPE )O\b"), "0"),                                # PE O -> PE 0
]


def correggi_ocr(testo: str) -> str:
    """Corregge confusioni sistematiche dell'OCR (cifre, «l» al posto di «I»)."""
    for regola, sostituzione in CORREZIONI_OCR:
        testo = regola.sub(sostituzione, testo)
    return testo


def pulisci_caratteri(chars: list[dict], size: float) -> str:
    """Ricompone gli spazi dalla geometria dei glifi, ignorando quelli dell'OCR.

    Misurato sul PDF: tra lettere della stessa parola lo scarto resta sotto
    0,17 volte il corpo, tra parole supera 0,19. L'OCR inserisce spesso spazi
    spuri (titoli in maiuscoletto, cifre) e non ne omette mai di veri.
    La cifra «1» ha un glifo stretto: tra due cifre lo scarto è più largo.
    """
    glifi = [c for c in chars if c["c"].strip()]
    out: list[str] = []
    for i, c in enumerate(glifi):
        if i:
            prec = glifi[i - 1]
            scarto = (c["bbox"][0] - prec["bbox"][2]) / size
            cifre = prec["c"].isdigit() and c["c"].isdigit() and "1" in (prec["c"], c["c"])
            if scarto >= (1.2 if cifre else 0.19):
                out.append(" ")
        out.append(c["c"])
    return "".join(out)


def righe_pagina(pagina: fitz.Page) -> list[dict]:
    righe = []
    for blocco in pagina.get_text("rawdict")["blocks"]:
        if blocco["type"] != 0:
            continue
        for linea in blocco["lines"]:
            chars = [c for s in linea["spans"] for c in s["chars"]]
            dimensioni = [s["size"] for s in linea["spans"] if any(c["c"].strip() for c in s["chars"])]
            if not dimensioni:
                continue
            testo = correggi_ocr(pulisci_caratteri(chars, max(dimensioni)))
            x0, y0, x1, y1 = linea["bbox"]
            righe.append({
                "bbox": [round(x0, 1), round(y0, 1), round(x1, 1), round(y1, 1)],
                "size": round(max(dimensioni), 1),
                "testo": testo,
            })
    return righe


def immagini_pagina(pagina: fitz.Page) -> list[list[float]]:
    """Riquadri di immagini abbastanza grandi da poter portare informazioni."""
    area_pagina = pagina.rect.width * pagina.rect.height
    out = []
    for info in pagina.get_image_info():
        x0, y0, x1, y1 = info["bbox"]
        w, h = x1 - x0, y1 - y0
        if w < 60 or h < 60 or w * h > 0.9 * area_pagina:
            continue
        out.append([round(x0), round(y0), round(x1), round(y1)])
    return out


def colonna(riga: dict, centro: float) -> str:
    x0, _, x1, _ = riga["bbox"]
    if x1 <= centro + SCARTO_COLONNA:
        return "S"
    if x0 >= centro - SCARTO_COLONNA:
        return "D"
    return "P"  # piena larghezza


def raggruppa_file(righe: list[dict]) -> list[list[dict]]:
    """Unisce in una fila le righe sovrapposte in verticale (celle di tabella)."""
    file: list[list[dict]] = []
    for r in sorted(righe, key=lambda r: (r["bbox"][1] + r["bbox"][3]) / 2):
        y0, y1 = r["bbox"][1], r["bbox"][3]
        if file:
            ultima = file[-1]
            fy0 = min(x["bbox"][1] for x in ultima)
            fy1 = max(x["bbox"][3] for x in ultima)
            sovrapp = min(y1, fy1) - max(y0, fy0)
            if sovrapp > 0.5 * min(y1 - y0, fy1 - fy0):
                ultima.append(r)
                continue
        file.append([r])
    for f in file:
        f.sort(key=lambda r: r["bbox"][0])
    return file


def ordina_lettura(righe: list[dict], larghezza: float) -> list[list[dict]]:
    """Ordine di lettura: fasce separate da elementi a piena larghezza, poi colonna sinistra e destra."""
    centro = larghezza / 2
    for r in righe:
        r["col"] = colonna(r, centro)
    piene = sorted((r for r in righe if r["col"] == "P"), key=lambda r: r["bbox"][1])
    confini = [r["bbox"][1] for r in piene] + [float("inf")]
    ordinate: list[list[dict]] = []
    inizio = float("-inf")
    for i, confine in enumerate(confini):
        fascia = [r for r in righe if r["col"] != "P" and inizio <= r["bbox"][1] < confine]
        for col in ("S", "D"):
            ordinate += raggruppa_file([r for r in fascia if r["col"] == col])
        if i < len(piene):
            ordinate.append([piene[i]])
            inizio = piene[i]["bbox"][1]
    return ordinate


def celle(fila: list[dict]) -> list[str]:
    """Divide una fila in celle quando lo spazio orizzontale è ampio."""
    out: list[str] = []
    prec_x1 = None
    for r in fila:
        if prec_x1 is not None and r["bbox"][0] - prec_x1 < SPAZIO_CELLA and out:
            out[-1] += " " + r["testo"]
        else:
            out.append(r["testo"])
        prec_x1 = r["bbox"][2]
    return out


def unisci(a: str, b: str) -> str:
    if a.endswith(("­", "·")):
        return a[:-1] + b
    return a + " " + b


def margini_colonne(righe: list[dict], larghezza: float) -> dict[str, float]:
    """Margine destro tipico di ciascuna colonna (per riconoscere righe corte)."""
    out = {}
    for col in ("S", "D", "P"):
        x1 = sorted(r["bbox"][2] for r in righe if r.get("col") == col)
        out[col] = x1[int(len(x1) * 0.9)] if x1 else larghezza
    return out


def sezioni_per_pagina(doc: fitz.Document) -> dict[int, list[str]]:
    """Percorso di segnalibri attivo all'inizio di ogni pagina."""
    toc = doc.get_toc()
    out: dict[int, list[str]] = {}
    percorso: list[str] = []
    i = 0
    for n in range(1, doc.page_count + 1):
        while i < len(toc) and toc[i][2] <= n:
            livello, titolo, _ = toc[i]
            percorso = percorso[: livello - 1] + [titolo]
            i += 1
        out[n] = percorso[:2]
    return out


def costruisci_vocabolario(pagine) -> collections.Counter:
    """Frequenza delle parole del testo corrente (minuscole)."""
    voc: collections.Counter = collections.Counter()
    for righe in pagine:
        for r in righe:
            if r["size"] < SOGLIA_TITOLO:
                voc.update(w.lower() for w in re.findall(r"[^\W\d_]+", r["testo"]))
    return voc


def noto(parola: str, voc: collections.Counter) -> bool:
    """Parola esistente da sola (le lettere isolate valgono solo se a/e/i/o)."""
    if len(parola) == 1:
        return parola in "aeio"
    return voc[parola] >= (20 if len(parola) <= 3 else 2)


def ricomponi_parole(testo: str, voc: collections.Counter) -> str:
    """Riunisce le parole spezzate dall'OCR nei titoli in maiuscoletto.

    Sceglie la segmentazione con meno pezzi sconosciuti, unendo solo token
    adiacenti la cui concatenazione è una parola nota del testo corrente.
    """
    token = testo.split(" ")
    n = len(token)
    costo = [0.0] + [float("inf")] * n
    scelta = [0] * (n + 1)
    for j in range(1, n + 1):
        for i in range(max(0, j - 6), j):
            parola = "".join(token[i:j])
            pulita = re.sub(r"[^\w]", "", parola).lower()
            if j - i == 1:
                c = 1 if (voc[pulita] >= 2 or not pulita.isalpha()) else 4
            elif pulita.isalpha() and voc[pulita] >= 2 and any(
                    not noto(re.sub(r"[^\w]", "", t).lower(), voc) for t in token[i:j]):
                c = 1
            else:
                continue
            if costo[i] + c < costo[j]:
                costo[j], scelta[j] = costo[i] + c, i
    pezzi, j = [], n
    while j > 0:
        pezzi.append("".join(token[scelta[j]:j]))
        j = scelta[j]
    return " ".join(reversed(pezzi))


def main() -> None:
    sha = sha256_file(PDF)
    if sha != PDF_SHA256:
        print(f"ATTENZIONE: il PDF ha hash {sha}, diverso da quello verificato.")
        print("Una versione diversa richiede una nuova verifica delle parti cambiate.")
    doc = fitz.open(PDF)
    da, a = 1, doc.page_count
    if len(sys.argv) == 3:
        da, a = int(sys.argv[1]), int(sys.argv[2])
    sezioni = sezioni_per_pagina(doc)
    pagine = []
    GREZZO.mkdir(parents=True, exist_ok=True)
    AUTO.mkdir(parents=True, exist_ok=True)
    tutte = {n: righe_pagina(doc[n - 1]) for n in range(1, doc.page_count + 1)}
    vocabolario = costruisci_vocabolario(tutte.values())
    for n in range(da, a + 1):
        pagina = doc[n - 1]
        righe = tutte[n]
        for r in righe:
            if r["size"] >= SOGLIA_TITOLO or r["testo"].isupper():
                r["testo"] = ricomponi_parole(r["testo"], vocabolario)
        corpo = [r for r in righe if r["bbox"][1] < PIE_DI_PAGINA_Y]
        piede = " / ".join(r["testo"] for r in righe if r["bbox"][1] >= PIE_DI_PAGINA_Y)
        file = ordina_lettura(corpo, pagina.rect.width)
        margini = margini_colonne(corpo, pagina.rect.width)
        # Segna le righe corte rispetto al margine della loro colonna.
        for fila in file:
            for r in fila:
                r["corta"] = r["bbox"][2] < margini[r["col"]] - 12
        immagini = immagini_pagina(pagina)
        scrivi_json(GREZZO / f"{nome_pagina(n)}.json", {
            "pagina_pdf": n,
            "pagina_stampata": pagina_stampata(n),
            "dimensioni": [round(pagina.rect.width, 1), round(pagina.rect.height, 1)],
            "piede": piede,
            "immagini": immagini,
            "righe": corpo,
        })
        testo = in_markdown(file)
        stampata = pagina_stampata(n)
        intest = f"<!-- pagina PDF {n}" + (f" · pagina stampata {stampata}" if stampata else "") + " -->\n\n"
        (AUTO / f"{nome_pagina(n)}.md").write_text(intest + testo, encoding="utf-8")
        pagine.append({
            "pagina_pdf": n,
            "pagina_stampata": stampata,
            "sezione": sezioni[n],
            "caratteri": sum(len(r["testo"]) for r in corpo),
            "righe": len(corpo),
            "immagini": len(immagini),
            "senza_testo": sum(len(r["testo"]) for r in corpo) < 50,
            "piede": piede,
        })
    if da == 1 and a == doc.page_count:
        toc = doc.get_toc()
        scrivi_json(INVENTARIO, {
            "pdf": str(PDF.relative_to(PDF.parents[2])).replace("\\", "/"),
            "sha256": sha,
            "pagine_totali": doc.page_count,
            "dimensione_byte": PDF.stat().st_size,
            "segnalibri": len(toc),
            "capitoli": [{"titolo": t, "pagina_pdf": p} for lv, t, p in toc if lv == 1],
            "pagine_senza_testo": [p["pagina_pdf"] for p in pagine if p["senza_testo"]],
            "pagine_con_immagini": [p["pagina_pdf"] for p in pagine if p["immagini"]],
            "pagine": pagine,
        })
    print(f"Estratte pagine {da}-{a}.")


def in_markdown(file: list[list[dict]]) -> str:
    """Paragrafi, titoli (per dimensione del carattere), elenchi e righe di tabella."""
    blocchi: list[str] = []
    paragrafo = ""
    prec = None

    def chiudi():
        nonlocal paragrafo
        if paragrafo:
            blocchi.append(paragrafo.replace("­", "").replace("· ", ""))
            paragrafo = ""

    for fila in file:
        testi = celle(fila)
        size = max(r["size"] for r in fila)
        y0 = min(r["bbox"][1] for r in fila)
        if len(testi) > 1:
            chiudi()
            blocchi.append("| " + " | ".join(testi) + " |")
            prec = None
            continue
        testo = testi[0]
        if size >= SOGLIA_TITOLO:
            chiudi()
            blocchi.append(("## " if size >= 12.5 else "### ") + testo)
            prec = None
            continue
        elenco = testo.startswith(("•", "■"))
        nuovo = (
            prec is None
            or prec["col"] != fila[0]["col"]
            or y0 - prec["y1"] > 0.9 * size
            or y0 < prec["y0"]
            or elenco
            or re.match(r"^\d+:\s", testo) is not None
            or (prec["corta"] and prec["testo"].endswith((".", ":", "!", "?", ".»", ".\"")))
        )
        if nuovo:
            chiudi()
            paragrafo = ("- " + testo[1:].strip()) if elenco else testo
        else:
            paragrafo = unisci(paragrafo, testo)
        prec = {
            "col": fila[0]["col"],
            "y0": y0,
            "y1": max(r["bbox"][3] for r in fila),
            "testo": testo,
            "corta": fila[-1].get("corta", False),
        }
    chiudi()
    out: list[str] = []
    for b in blocchi:
        if out and b.startswith("|") and out[-1].startswith("|"):
            out[-1] += "\n" + b
        else:
            out.append(b)
    return "\n\n".join(out) + "\n"


if __name__ == "__main__":
    main()
