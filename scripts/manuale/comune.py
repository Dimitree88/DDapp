"""Percorsi e utilità condivise per la copia verificata del Manuale del Giocatore 2024."""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from pathlib import Path

RADICE = Path(__file__).resolve().parents[2]
PDF = RADICE / "docs" / "regole" / "Manuale Del Giocatore - 2024.pdf"
# La copia contiene il testo del manuale: resta locale e ignorata da Git.
COPIA = RADICE / "docs" / "manuale-copia"
GREZZO = COPIA / "grezzo"          # estrazione con coordinate (rigenerabile)
AUTO = COPIA / "auto"              # ricostruzione automatica (rigenerabile)
VERIFICATO = COPIA / "verificato"  # trascrizione corretta a mano (mai sovrascritta)
CORREZIONI = COPIA / "correzioni"  # diff auto -> verificato (rigenerabile)
FIGURE = COPIA / "figure"          # ritagli di figure con informazioni
CAPITOLI = COPIA / "capitoli"      # copia assemblata per capitolo
INVENTARIO = COPIA / "inventario.json"
# Nel repository: solo stato, senza testo del manuale.
STATO = Path(__file__).resolve().parent / "stato-verifica.json"

# Hash della versione del PDF su cui la copia è stata costruita e verificata.
PDF_SHA256 = "c55e18df5398a25341a249830b3a346733eafd3465b1aad731a5473bba796189"
# Pagina stampata = pagina PDF - 3 (verificato sui piè di pagina).
SCARTO_PAGINA = 3


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for blocco in iter(lambda: f.read(1 << 20), b""):
            h.update(blocco)
    return h.hexdigest()


def sha256_testo(testo: str) -> str:
    return hashlib.sha256(testo.encode("utf-8")).hexdigest()


def nome_pagina(n: int) -> str:
    return f"p{n:03d}"


def pagina_stampata(n: int) -> int | None:
    return n - SCARTO_PAGINA if n > SCARTO_PAGINA else None


def leggi_json(path: Path, predefinito=None):
    if not path.exists():
        return predefinito
    return json.loads(path.read_text(encoding="utf-8"))


def scrivi_json(path: Path, dati) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(dati, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def normalizza(testo: str) -> str:
    """Minuscole, senza accenti, apostrofi e trattini uniformi, spazi compattati."""
    testo = unicodedata.normalize("NFKD", testo)
    testo = "".join(c for c in testo if not unicodedata.combining(c))
    testo = testo.lower().replace("­", "")
    testo = re.sub(r"[’‘`´]", "'", testo)
    testo = re.sub(r"[–—−]", "-", testo)
    return re.sub(r"\s+", " ", testo).strip()
