// Esporta una scheda in PDF (testo, generato dai dati — indipendente dal layout).
import type { Sheet } from "./sheet";

const CAR_FULL: Record<string, string> = {
  FOR: "FORZA",
  DES: "DESTREZZA",
  COS: "COSTITUZIONE",
  INT: "INTELLIGENZA",
  SAG: "SAGGEZZA",
  CAR: "CARISMA",
};

function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v.trim())
    return v.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

// I font standard del PDF sono Latin-1: sostituisco i caratteri "tipografici".
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

  const margin = 44;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: number; gap?: number; indent?: number } = {},
  ) => {
    const { size = 10, bold = false, color = 40, gap = 3, indent = 0 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(clean(text), maxW - indent) as string[];
    for (const ln of lines) {
      ensure(size + gap);
      doc.text(ln, margin + indent, y);
      y += size + gap;
    }
  };

  const heading = (text: string) => {
    y += 8;
    ensure(20);
    doc.setDrawColor(190, 166, 127);
    doc.setLineWidth(0.6);
    write(text.toUpperCase(), { size: 12, bold: true, color: 122 });
    doc.line(margin, y - 2, pageW - margin, y - 2);
    y += 4;
  };

  const field = (label: string, value: string) => {
    if (!value) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const labW = doc.getTextWidth(clean(label) + ": ");
    doc.setTextColor(90);
    ensure(13);
    doc.text(clean(label) + ": ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    const lines = doc.splitTextToSize(clean(value), maxW - labW) as string[];
    doc.text(lines[0] ?? "", margin + labW, y);
    y += 13;
    for (let i = 1; i < lines.length; i++) {
      ensure(13);
      doc.text(lines[i], margin + labW, y);
      y += 13;
    }
  };

  const stamp = dateStamp();

  // Intestazione
  write(clean(name) || "Senza nome", { size: 20, bold: true, color: 92, gap: 6 });
  write(`Scheda D&D — esportata il ${stamp}`, { size: 9, color: 130, gap: 4 });

  // Stato & Identità
  heading("Stato & Identità");
  field("Livello", sheet.livello);
  field("Classe", sheet.classe);
  field("Punti Ferita", sheet.puntiFerita);
  field("Punti Ferita Massimi", sheet.puntiFeritaMax);
  field("Classe Armatura", sheet.classeArmatura);
  field("Scudo", sheet.scudo);
  field("Iniziativa", sheet.iniziativa);
  field("Bonus Competenza", sheet.bonusCompetenza);
  field("Percezione Passiva", sheet.percezionePassiva);
  field("Dadi Vita", sheet.dadiVita);
  field("Punti Esperienza", sheet.puntiEsperienza);
  field("Ispirazione Eroica", sheet.ispirazioneEroica);
  field("Velocità", sheet.velocita);
  field("Allineamento", sheet.allineamento);
  field("Taglia", sheet.taglia);
  field("Specie", sheet.specie);
  field("Background", sheet.background);

  // Lingue
  const lingue = toList(sheet.lingue);
  if (lingue.length) {
    heading("Lingue");
    lingue.forEach((l) => write("• " + l, { indent: 6 }));
  }

  // Caratteristiche
  heading("Caratteristiche");
  sheet.caratteristiche.forEach((c) => {
    write(c.nome, { bold: true, gap: 2 });
    write(
      `Valore ${c.valore || "—"}   Modificatore ${c.modificatore || "—"}   Tiro Salvezza ${c.tsBonus || "—"}${c.tsCompetente ? " (competente)" : ""}`,
      { indent: 6, color: 70 },
    );
  });

  // Abilità
  heading("Abilità");
  sheet.abilita.forEach((a) => {
    const cat = CAR_FULL[a.caratteristica] ?? a.caratteristica;
    const parts = [`${a.nome} (${cat})`, a.bonus || "—"];
    if (a.competente) parts.push("competente");
    if (a.note) parts.push(a.note);
    write("• " + parts.join(" — "), { indent: 6 });
  });

  // Incantesimi
  if (sheet.incantesimi.length) {
    heading("Incantesimi");
    sheet.incantesimi.forEach((inc) => {
      write(`${inc.nome || "—"}${inc.livello ? ` (Livello ${inc.livello})` : ""}`, { bold: true, gap: 2 });
      const meta = [
        inc.tempo && `Tempo: ${inc.tempo}`,
        inc.gittata && `Gittata: ${inc.gittata}`,
        inc.componenti && `Componenti: ${inc.componenti}`,
        inc.durata && `Durata: ${inc.durata}`,
        inc.crm && `C/R/M: ${inc.crm}`,
      ].filter(Boolean).join("   ");
      if (meta) write(meta, { indent: 6, size: 9, color: 90 });
      if (inc.note) write(inc.note, { indent: 6, color: 60 });
    });
  }

  // Armi
  heading("Armi");
  const compArmi = toList(sheet.competenzeArmi);
  if (compArmi.length) field("Competenze armi", compArmi.join(", "));
  sheet.armi.forEach((a) => {
    write(`${a.nome || "—"}${a.quantita ? ` ×${a.quantita}` : ""}`, { bold: true, gap: 2 });
    const meta = [
      a.bonus && `Bonus: ${a.bonus}`,
      a.danno && `Danno: ${a.danno}`,
      a.gittata && `Gittata: ${a.gittata}`,
    ].filter(Boolean).join("   ");
    if (meta) write(meta, { indent: 6, size: 9, color: 90 });
    if (a.note) write(a.note, { indent: 6, color: 60 });
  });

  // Equipaggiamento
  heading("Equipaggiamento");
  const ca = sheet.competenzeArmatura;
  const caList = [
    ca.leggere && "Leggere",
    ca.medie && "Medie",
    ca.pesanti && "Pesanti",
    ca.scudi && "Scudi",
  ].filter(Boolean).join(", ");
  if (caList) field("Competenze armatura", caList);
  sheet.equipaggiamento.forEach((e) => {
    write(`• ${e.nome || "—"}${e.dettaglio ? ` — ${e.dettaglio}` : ""}`, { indent: 6 });
  });

  // Monete
  const coins = [
    ["Rame", sheet.monete.rame],
    ["Argento", sheet.monete.argento],
    ["Electrum", sheet.monete.electrum],
    ["Oro", sheet.monete.oro],
    ["Platino", sheet.monete.platino],
  ].filter(([, v]) => v) as [string, string][];
  if (coins.length) {
    heading("Monete");
    write(coins.map(([k, v]) => `${k}: ${v}`).join("   "), { indent: 6 });
  }

  // Privilegi
  if (sheet.privilegi.length) {
    heading("Privilegi");
    sheet.privilegi.forEach((p) => {
      write(p.titolo || "—", { bold: true, gap: 2 });
      if (p.descrizione) write(p.descrizione, { indent: 6, color: 60 });
    });
  }

  // Talenti
  if (sheet.talenti.length) {
    heading("Talenti");
    sheet.talenti.forEach((t) => {
      write(t.nome || "—", { bold: true, gap: 2 });
      if (t.descrizione) write(t.descrizione, { indent: 6, color: 60 });
    });
  }

  const safeName = (name || "scheda").replace(/[^\w\-]+/g, "_");
  doc.save(`${safeName}_${stamp}.pdf`);
}
