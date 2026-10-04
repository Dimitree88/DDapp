"""Extract the stable spell stat blocks from the checked-in Italian SRD 5.2.1."""

import json
import re
import unicodedata
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "lib/incantesimi-srd-2024.json"
OUTPUT = ROOT / "lib/incantesimi-dettagli-srd-2024.json"
PDF = ROOT / "docs/regole/IT_SRD_CC_v5.2.1.pdf"


def key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).casefold()
    return re.sub(r"[^a-z0-9]+", "", normalized)


def clean(value: str) -> str:
    return " ".join(value.replace("\ufffd", "").replace("\xad", "").split())


catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
document = fitz.open(PDF)
blocks = {}
for page_index in range(120, 202):
    lines = document[page_index].get_text().splitlines()
    for index, line in enumerate(lines[:-1]):
        if "livello" in lines[index + 1].lower() or "trucchetto" in lines[index + 1].lower():
            blocks.setdefault(key(line), (page_index + 1, lines[index + 1 :]))

details = {}
for name in catalog["incantesimi"]:
    page, lines = blocks[key(name)]
    stat_end = next((i for i, line in enumerate(lines) if line.startswith("Durata:")), None)
    if stat_end is None:
        raise ValueError(f"Missing duration: {name}")
    stats = lines[: stat_end + 1]
    heading = clean(" ".join(stats[: next(i for i, s in enumerate(stats) if s.startswith("Tempo di lancio:"))]))
    if heading.lower().startswith("trucchetto di "):
        level = 0
        school_and_classes = heading[len("Trucchetto di ") :]
    else:
        match = re.match(r"(.+?) di (\d+)[^ ]* livello (.+)", heading)
        if not match:
            raise ValueError(f"Unrecognized heading: {name}: {heading}")
        school_and_classes = f"{match.group(1)} {match.group(3)}"
        level = int(match.group(2))
    match = re.match(r"(.+?) \((.+)\)$", school_and_classes)
    if not match:
        raise ValueError(f"Missing classes: {name}: {school_and_classes}")
    result = {
        "livello": level,
        "scuola": match.group(1),
        "classi": [x.strip() for x in match.group(2).split(",")],
    }
    for label, field in (
        ("Tempo di lancio:", "tempo"),
        ("Gittata:", "gittata"),
        ("Componenti:", "componenti"),
        ("Durata:", "durata"),
    ):
        labels = (label, "Componente:") if field == "componenti" else (label,)
        start = next((i for i, line in enumerate(stats) if line.startswith(labels)), None)
        if start is None:
            raise ValueError(f"Missing {label} for {name}")
        end = next((i for i in range(start + 1, len(stats)) if any(stats[i].startswith(other) for other in ("Tempo di lancio:", "Gittata:", "Componenti:", "Componente:", "Durata:"))), len(stats))
        actual_label = next(candidate for candidate in labels if stats[start].startswith(candidate))
        raw_value = " ".join(stats[start:end])[len(actual_label):]
        value = clean(raw_value)
        if field == "componenti":
            if "\ufffd" not in raw_value:
                material = re.search(r"\((.*)\)", value)
                if material:
                    result["materiale"] = material.group(1)
            value = value.split("(")[0].strip().rstrip(",")
        result[field] = value
    result["pagina"] = page
    details[name] = result

OUTPUT.write_text(json.dumps(details, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {len(details)} spell stat blocks from {PDF.name}")
