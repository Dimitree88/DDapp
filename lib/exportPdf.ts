// Esporta una scheda in PDF cercando di somigliare alla visualizzazione dell'app
// (tema "pergamena": font serif, palette, sezioni a card).
import type { Sheet } from "./sheet";
import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "./abilityBonus";
import { displayedWeaponAttack, weaponAttack } from "./weaponAttack";
import { displayedArmorClass } from "./armorClass";
import { spellSlots, spellcastingStats } from "./spellcasting";
import { coinTotalGold } from "./coins";
import { carryingCapacity, inventoryWeight } from "./inventoryWeight";
import { displayedMaxHp } from "./classProgression";
import { displayedSpeed } from "./speed";

const CAR_FULL: Record<string, string> = {
  FOR: "FORZA",
  DES: "DESTREZZA",
  COS: "COSTITUZIONE",
  INT: "INTELLIGENZA",
  SAG: "SAGGEZZA",
  CAR: "CARISMA",
};

type RGB = [number, number, number];
const C = {
  parchment: [236, 227, 208] as RGB,
  card: [251, 247, 236] as RGB,
  ink: [43, 32, 20] as RGB,
  inkSoft: [111, 91, 62] as RGB,
  inkFaint: [160, 138, 102] as RGB,
  line: [191, 166, 127] as RGB,
  accent: [122, 38, 24] as RGB,
};

function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v.trim())
    return v.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function clean(s: string): string {
  return (s || "")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...");
}

function dateStamp(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${String(d.getFullYear()).slice(-2)}`;
}

export async function exportSheetPdf(name: string, sheet: Sheet): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const M = 40;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const W = pageW - M * 2;
  let y = M;

  const setFill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const setText = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const serif = (style: "normal" | "bold" | "italic" = "normal") =>
    doc.setFont("times", style);
  // Spunta disegnata (i font PDF standard non hanno il carattere ✓).
  const checkAt = (cx: number, cy: number) => {
    setDraw(C.parchment);
    doc.setLineWidth(1);
    doc.line(cx - 2.2, cy + 0.2, cx - 0.6, cy + 2);
    doc.line(cx - 0.6, cy + 2, cx + 2.4, cy - 2.2);
  };

  const paintBg = () => {
    setFill(C.parchment);
    doc.rect(0, 0, pageW, pageH, "F");
  };
  paintBg();

  const newPage = () => {
    doc.addPage();
    paintBg();
    y = M;
  };
  const ensure = (h: number) => {
    if (y + h > pageH - M) newPage();
  };

  const lines = (text: string, w: number, size: number): string[] => {
    doc.setFontSize(size);
    return doc.splitTextToSize(clean(text) || "—", w) as string[];
  };

  // Testo a capo, avanza y. Ritorna l'altezza usata.
  const paragraph = (
    text: string,
    opts: { size?: number; style?: "normal" | "bold" | "italic"; color?: RGB; lh?: number; x?: number; w?: number } = {},
  ) => {
    const { size = 10, style = "normal", color = C.ink, lh = size * 1.4, x = M, w = W } = opts;
    serif(style);
    setText(color);
    doc.setFontSize(size);
    const ls = doc.splitTextToSize(clean(text) || "—", w) as string[];
    for (const ln of ls) {
      ensure(lh);
      doc.text(ln, x, y + size);
      y += lh;
    }
  };

  const sectionHeading = (title: string) => {
    y += 12;
    ensure(24);
    serif("bold");
    doc.setFontSize(12);
    setText(C.accent);
    doc.text(clean(title).toUpperCase(), M, y + 10);
    y += 16;
    setDraw(C.line);
    doc.setLineWidth(0.8);
    doc.line(M, y, M + W, y);
    y += 10;
  };

  // Nuova pagina per ogni tab, salvo `samePage` (resta nella pagina corrente).
  let firstTab = true;
  const tab = (title: string, samePage = false) => {
    if (!firstTab && !samePage) newPage();
    firstTab = false;
    sectionHeading(title);
  };
  const emptyNote = () =>
    paragraph("Niente da mostrare.", { size: 10, style: "italic", color: C.inkFaint });

  const card = (h: number, draw: (x: number, top: number, w: number) => void, w = W, x = M) => {
    ensure(h);
    setFill(C.card);
    setDraw(C.line);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, w, h, 6, 6, "FD");
    draw(x, y, w);
    y += h + 6;
  };

  // ---- Campo etichetta+valore (box in stile app) ----
  const valueBox = (label: string, value: string, x: number, w: number, top: number): number => {
    serif("bold");
    doc.setFontSize(8);
    setText(C.inkSoft);
    doc.text(clean(label).toUpperCase(), x, top + 8);
    const boxTop = top + 13;
    const vLines = lines(value, w - 12, 11);
    const boxH = 10 + vLines.length * 13;
    setFill(C.card);
    setDraw(C.line);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, boxTop, w, boxH, 4, 4, "FD");
    serif("normal");
    doc.setFontSize(11);
    setText(value ? C.ink : C.inkFaint);
    vLines.forEach((ln, i) => doc.text(ln, x + 6, boxTop + 15 + i * 13));
    return 13 + boxH;
  };

  const fieldRows = (rows: [string, string][][]) => {
    for (const row of rows) {
      const gap = 14;
      const colW = row.length === 2 ? (W - gap) / 2 : W;
      // Altezza della riga = max delle celle
      let rowH = 0;
      row.forEach(([, value]) => {
        const vLines = lines(value, colW - 12, 11);
        rowH = Math.max(rowH, 13 + 10 + vLines.length * 13);
      });
      ensure(rowH + 6);
      row.forEach(([label, value], i) => {
        valueBox(label, value, M + i * (colW + gap), colW, y);
      });
      y += rowH + 6;
    }
  };

  const stamp = dateStamp();

  // ===== Intestazione =====
  serif("bold");
  doc.setFontSize(24);
  setText(C.accent);
  ensure(30);
  doc.text(clean(name) || "Senza nome", M, y + 22);
  y += 32;
  serif("italic");
  doc.setFontSize(9);
  setText(C.inkFaint);
  doc.text(`Scheda D&D — esportata il ${stamp}`, M, y);
  y += 6;
  setDraw(C.line);
  doc.setLineWidth(1);
  doc.line(M, y, M + W, y);
  y += 4;

  // ===== Stato & Identità =====
  tab("Stato & Identità");
  fieldRows([
    [["Livello", sheet.livello], ["Classe", sheet.classe]],
    [["Sottoclasse", sheet.sottoclasse]],
    [["Punti Ferita", sheet.puntiFerita], ["Punti Ferita Massimi", displayedMaxHp(sheet)]],
    [["PF temporanei", sheet.puntiFeritaTemporanei ?? ""]],
    [["Classe Armatura", displayedArmorClass(sheet)]],
    [["Scudo", sheet.scudo ? "Sì" : "No"], ["Iniziativa", initiativeBonus(sheet)]],
    [["Bonus Competenza", proficiencyBonus(sheet.livello)], ["Percezione Passiva", passivePerception(sheet)]],
    [["Dadi Vita", sheet.dadiVita], ["Dadi Vita spesi", sheet.dadiVitaSpesi ?? ""]],
    [["TS morte superati", String(sheet.tiriMorte?.successi ?? 0)], ["TS morte falliti", String(sheet.tiriMorte?.fallimenti ?? 0)]],
    [["Punti Esperienza", sheet.puntiEsperienza]],
    [["Ispirazione Eroica", sheet.ispirazioneEroica ? "Sì" : "No"], ["Velocità", displayedSpeed(sheet) ? `${displayedSpeed(sheet)} m` : ""]],
    [["Allineamento", sheet.allineamento], ["Taglia", sheet.taglia]],
    [["Specie", sheet.lignaggio || sheet.specie]],
    [["Background", sheet.background]],
  ]);
  if (sheet.condizioni?.length) paragraph(`Condizioni: ${sheet.condizioni.join(", ")}`, { size: 10, color: C.inkSoft });

  // ===== Lingue ===== (stessa pagina di Stato & Identità)
  tab("Lingue", true);
  const lingue = toList(sheet.lingue);
  if (lingue.length) {
    lingue.forEach((l) => {
      serif("normal");
      doc.setFontSize(11);
      ensure(16);
      setText(C.accent);
      doc.text("•", M + 2, y + 10);
      setText(C.ink);
      doc.text(clean(l), M + 16, y + 10);
      y += 16;
    });
  } else {
    emptyNote();
  }

  // ===== Caratteristiche ===== (card a piena larghezza, come nell'app)
  tab("Caratteristiche");
  sheet.caratteristiche.forEach((c) => {
    card(66, (x, top, w) => {
      serif("bold");
      doc.setFontSize(13);
      setText(C.accent);
      doc.text(c.nome, x + 12, top + 22);
      // pill "Tiro Salvezza"
      const pw = 118;
      const px = x + w - pw - 12;
      const active = c.tsCompetente;
      setDraw(C.accent);
      if (active) setFill([242, 232, 230]);
      else setFill(C.card);
      doc.setLineWidth(active ? 1 : 0.5);
      setDraw(active ? C.accent : C.line);
      doc.roundedRect(px, top + 9, pw, 20, 10, 10, "FD");
      if (active) {
        setFill(C.accent);
        doc.circle(px + 14, top + 19, 5, "F");
        checkAt(px + 14, top + 19);
      } else {
        setDraw(C.inkFaint);
        doc.setLineWidth(0.6);
        doc.circle(px + 14, top + 19, 5, "S");
      }
      serif("normal");
      doc.setFontSize(9);
      setText(active ? C.accent : C.inkSoft);
      doc.text("Tiro Salvezza", px + 24, top + 22);
      // 3 colonne
      const cols: [string, string][] = [
        ["Valore", c.valore],
        ["Modificatore", abilityModifier(c.valore)],
        ["Tiro Salvezza", savingThrowBonus(sheet, c)],
      ];
      const innerX = x + 12;
      const innerW = w - 24;
      const cw = innerW / 3;
      cols.forEach(([lab, val], i) => {
        const cx = innerX + cw * i + cw / 2;
        serif("normal");
        doc.setFontSize(7.5);
        setText(C.inkFaint);
        doc.text(lab.toUpperCase(), cx, top + 44, { align: "center" });
        serif("bold");
        doc.setFontSize(13);
        setText(C.ink);
        doc.text(val || "—", cx, top + 60, { align: "center" });
      });
    });
  });

  // ===== Abilità ===== (griglia 2 colonne)
  tab("Abilità");
  {
    const gap = 10;
    const cw = (W - gap) / 2;
    for (let i = 0; i < sheet.abilita.length; i += 2) {
      const pair = sheet.abilita.slice(i, i + 2);
      const rowH = 32;
      ensure(rowH + 6);
      const top = y;
      pair.forEach((a, k) => {
        const x = M + k * (cw + gap);
        setFill(C.card);
        setDraw(C.line);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, top, cw, rowH, 5, 5, "FD");
        // dot
        if (a.competente) {
          setFill(C.accent);
          doc.circle(x + 12, top + 15, 4.5, "F");
          checkAt(x + 12, top + 15);
        } else {
          setDraw(C.inkFaint);
          doc.setLineWidth(0.7);
          doc.circle(x + 12, top + 15, 4.5, "S");
        }
        serif("bold");
        doc.setFontSize(9.5);
        setText(C.ink);
        doc.text(clean(a.nome), x + 22, top + 14, { maxWidth: cw - 60 });
        serif("normal");
        doc.setFontSize(7);
        setText(C.inkFaint);
        doc.text(CAR_FULL[a.caratteristica] ?? a.caratteristica, x + 22, top + 24);
        serif("bold");
        doc.setFontSize(11);
        setText(C.ink);
        doc.text(abilityBonus(sheet, a) || "—", x + cw - 10, top + 18, { align: "right" });
      });
      y += rowH + 6;
    }
  }

  // ===== helper per card titolo+righe (Incantesimi/Armi/Privilegi/Talenti) =====
  const titledCard = (title: string, sub: string, meta: string, body: string) => {
    serif("bold");
    const titleLines = lines(title, W - 24, 12).length;
    let h = 8 + titleLines * 15;
    if (meta) h += lines(meta, W - 24, 9).length * 12;
    if (body) h += 2 + lines(body, W - 24, 9.5).length * 13;
    h += 6;
    card(h, (x, top, w) => {
      let ty = top + 8;
      serif("bold");
      doc.setFontSize(12);
      setText(C.accent);
      (doc.splitTextToSize(clean(title) || "—", w - 24) as string[]).forEach((ln) => {
        doc.text(ln, x + 12, ty + 8);
        ty += 15;
      });
      if (sub) {
        serif("italic");
        doc.setFontSize(9);
        setText(C.inkFaint);
        doc.text(clean(sub), x + w - 12, top + 18, { align: "right" });
      }
      if (meta) {
        serif("normal");
        doc.setFontSize(9);
        setText(C.inkSoft);
        (doc.splitTextToSize(clean(meta), w - 24) as string[]).forEach((ln) => {
          doc.text(ln, x + 12, ty + 6);
          ty += 12;
        });
      }
      if (body) {
        ty += 2;
        serif("normal");
        doc.setFontSize(9.5);
        setText(C.ink);
        (doc.splitTextToSize(clean(body), w - 24) as string[]).forEach((ln) => {
          doc.text(ln, x + 12, ty + 8);
          ty += 13;
        });
      }
    });
  };

  // ===== Incantesimi =====
  tab("Incantesimi");
  const casting = spellcastingStats(sheet);
  if (casting) paragraph(`CD ${casting.dc} · Attacco magico ${casting.attack} (${casting.ability})`, { size: 10, color: C.inkSoft });
  const slots = spellSlots(sheet).filter((slot) => slot.maximum > 0);
  if (slots.length) paragraph(`Slot spesi: ${slots.map((slot) => `${slot.level}º ${slot.spent}/${slot.maximum}`).join(" · ")}`, { size: 10, color: C.inkSoft });
  if (sheet.incantesimi.length) {
    sheet.incantesimi.forEach((inc) => titledCard(inc.nome || "—", "", [inc.fonte, inc.stato].filter(Boolean).join(" · "), inc.caratteristica ? `Caratteristica: ${inc.caratteristica}` : ""));
  } else {
    emptyNote();
  }

  // ===== Armi ===== (stessa pagina di Incantesimi)
  tab("Armi", true);
  const compArmi = toList(sheet.competenzeArmi);
  if (compArmi.length) {
    paragraph("Competenze armi: " + compArmi.join(", "), { size: 10, color: C.inkSoft });
    y += 4;
  }
  if (sheet.padronanzeArmi?.length) paragraph("Padronanze: " + sheet.padronanzeArmi.join(", "), { size: 10, color: C.inkSoft });
  if (sheet.armi.length) {
    sheet.armi.forEach((a) => {
      const attack = displayedWeaponAttack(sheet, a);
      const damage = weaponAttack(sheet, a)?.damage;
      const meta = [
        attack && `Attacco: ${attack}`,
        damage && `Danno: ${damage}`,
      ].filter(Boolean).join("   ");
      titledCard(a.nome || "—", a.quantita ? `×${a.quantita}` : "", meta, a.note);
    });
  } else {
    emptyNote();
  }

  // ===== Equipaggiamento =====
  tab("Equipaggiamento");
  const ca = sheet.competenzeArmatura;
  const caList = [
    ca.leggere && "Leggere",
    ca.medie && "Medie",
    ca.pesanti && "Pesanti",
    ca.scudi && "Scudi",
  ].filter(Boolean).join(", ");
  if (caList) {
    paragraph("Competenze armatura: " + caList, { size: 10, color: C.inkSoft });
    y += 4;
  }
  if (sheet.equipaggiamento.length) {
    sheet.equipaggiamento.forEach((e) => {
      titledCard(e.nome || "—", e.quantita ? `×${e.quantita}${e.unita ? ` ${e.unita}` : ""}` : "", [e.indossato && "Indossata", e.impugnato && "Impugnato", e.contenitore && `In: ${e.contenitore}`].filter(Boolean).join(" · "), e.dettaglio);
    });
  } else {
    emptyNote();
  }
  if (sheet.competenzeStrumenti?.length) paragraph("Competenze strumenti: " + sheet.competenzeStrumenti.join(", "), { size: 10, color: C.inkSoft });
  const carriedWeight = inventoryWeight(sheet);
  paragraph(`Peso catalogato: ${carriedWeight.knownKg} kg${carryingCapacity(sheet) !== null ? ` / capacità ${carryingCapacity(sheet)} kg` : ""}${carriedWeight.unknownItems.length ? `; peso non noto per ${carriedWeight.unknownItems.join(", ")}` : ""}`, { size: 10, color: C.inkSoft });

  // ===== Monete =====
  tab("Monete");
  fieldRows([
    [["Rame", sheet.monete.rame], ["Argento", sheet.monete.argento]],
    [["Electrum", sheet.monete.electrum], ["Oro", sheet.monete.oro]],
    [["Platino", sheet.monete.platino]],
  ]);
  paragraph(`Valore equivalente: ${coinTotalGold(sheet.monete) ?? "—"} mo`, { size: 10, color: C.inkSoft });

  // ===== Privilegi ===== (stessa pagina di Monete)
  tab("Privilegi", true);
  if (sheet.privilegi.length) {
    sheet.privilegi.forEach((p) => titledCard(p.titolo || "—", "", "", p.scelte));
  } else {
    emptyNote();
  }
  if (sheet.risorse?.length) sheet.risorse.forEach((resource) => titledCard(resource.nome, `${resource.massimo - resource.spesi}/${resource.massimo}`, resource.fonte, `Ricarica: ${resource.ricarica}`));
  if (sheet.fontiCompetenze?.length) sheet.fontiCompetenze.forEach((record) => paragraph(`${record.valore} (${record.tipo}): ${record.fonte}`, { size: 10, color: C.inkSoft }));

  // ===== Talenti ===== (stessa pagina di Monete)
  tab("Talenti", true);
  if (sheet.talenti.length) {
    sheet.talenti.forEach((t) => titledCard(t.nome || "—", "", "", t.scelte));
  } else {
    emptyNote();
  }

  const safeName = (name || "scheda").replace(/[^\w\-]+/g, "_");
  doc.save(`${safeName}_${stamp}.pdf`);
}
