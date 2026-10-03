import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import fields from "./pdfTemplateFields.json";
import type { Sheet } from "./sheet";

type Mapping = (typeof fields)[number];

function sourceValue(mapping: Mapping, name: string, sheet: Sheet): string | boolean | undefined {
  const source = mapping.source;
  if (source === "name") return name;
  if (source === "sheet.privilegi" || source === "sheet.talenti" || source === "sheet.equipaggiamento") return undefined;
  if (source === "sheet.specie" && mapping.field === "textarea_142hif") return undefined;
  if (source === "sheet.specie") return sheet.lignaggio || sheet.specie;
  if (source === "sheet.classe") return sheet.sottoclasse ? `${sheet.classe} - ${sheet.sottoclasse}` : sheet.classe;
  if (source === "sheet.velocita") return sheet.velocita ? `${sheet.velocita} m` : "";
  if (source === "sheet.competenzeArmi") return sheet.competenzeArmi.join(", ");
  if (source === "sheet.lingue") return sheet.lingue.join(", ");
  const car = source.match(/^sheet\.caratteristiche\[abbr=(.+?)\]\.(.+)$/);
  if (car) {
    const item = sheet.caratteristiche.find((c) => c.abbr === car[1]);
    return item?.[car[2] as keyof typeof item];
  }
  const abilita = source.match(/^sheet\.abilita\[nome=(.+?)\]\.(.+)$/);
  if (abilita) {
    const item = sheet.abilita.find((a) => a.nome.toLocaleLowerCase("it") === abilita[1].toLocaleLowerCase("it"));
    return item?.[abilita[2] as keyof typeof item];
  }
  const array = source.match(/^sheet\.(armi|incantesimi)\[(\d+)\]\.(\w+)$/);
  if (array) {
    const index = Number(array[2]);
    if (array[1] === "armi") {
      const item = sheet.armi[index];
      if (!item) return undefined;
      if (array[3] === "nome") {
        const quantity = Number(item.quantita);
        return Number.isInteger(quantity) && quantity > 1 ? `${item.nome} x${quantity}` : item.nome;
      }
      return item[array[3] as keyof typeof item];
    }
    const item = sheet.incantesimi[index];
    if (!item) return undefined;
    return item[array[3] as keyof typeof item];
  }
  const key = source.slice(6);
  if (key.startsWith("monete.")) return sheet.monete[key.slice(7) as keyof Sheet["monete"]];
  if (key.startsWith("competenzeArmatura.")) return sheet.competenzeArmatura[key.slice(19) as keyof Sheet["competenzeArmatura"]];
  const value = sheet[key as keyof Sheet];
  return typeof value === "string" || typeof value === "boolean" ? value :
    typeof value === "number" ? String(value) : undefined;
}

function wrappedLines(text: string, width: number, size: number, measure: (text: string, size: number) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate, size) > width) {
        lines.push(line);
        line = word;
      } else line = candidate;
      while (measure(line, size) > width && line.length > 1) {
        let end = line.length - 1;
        while (end > 1 && measure(line.slice(0, end), size) > width) end--;
        lines.push(line.slice(0, end));
        line = line.slice(end);
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildTemplatePdf(name: string, sheet: Sheet, templateBytes: Uint8Array, fontBytes: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes);
  const backgrounds = await pdf.embedPdf(templateBytes, [0, 1]);
  const pages = backgrounds.map((background) => {
    const page = pdf.addPage([background.width, background.height]);
    page.drawPage(background);
    return page;
  });
  const measure = (text: string, size: number) => font.widthOfTextAtSize(text, size);
  const byField = new Map(fields.map((field) => [field.field, field]));
  const draw = (mapping: Mapping, value: string) => {
    const page = pages[mapping.page];
    const width = Math.max(1, mapping.width - 4);
    const multiline = mapping.field.startsWith("textarea_");
    if (multiline) {
      const size = 7;
      const limit = Math.max(1, Math.floor((mapping.height - 4) / (size * 1.2)));
      wrappedLines(value, width, size, measure).slice(0, limit).forEach((line, index) => {
        page.drawText(line, { x: mapping.x + 2, y: page.getHeight() - mapping.y - 2 - size - index * size * 1.2, size, font, color: rgb(0, 0, 0) });
      });
    } else {
      let text = value.replace(/\s+/g, " ").trim();
      let size = Math.min(11, Math.max(5, mapping.height * 0.65));
      while (size > 5 && measure(text, size) > width) size -= 0.5;
      while (text && measure(text, size) > width) text = text.slice(0, -1);
      page.drawText(text, { x: mapping.x + 2, y: page.getHeight() - mapping.y - 1 - size, size, font, color: rgb(0, 0, 0) });
    }
  };
  const check = (mapping: Mapping) => {
    const page = pages[mapping.page];
    const x = mapping.x + mapping.width / 2;
    const y = page.getHeight() - mapping.y - mapping.height / 2;
    const radius = Math.min(mapping.width, mapping.height) * 0.38;
    page.drawLine({ start: { x: x - radius, y: y - radius }, end: { x: x + radius, y: y + radius }, thickness: 1.2, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: x - radius, y: y + radius }, end: { x: x + radius, y: y - radius }, thickness: 1.2, color: rgb(0, 0, 0) });
  };

  // The form uses arbitrary Sejda field names. The reviewed mapping is kept
  // separate from the rendering logic so coordinates never depend on array order.
  for (const mapping of fields) {
    const value = sourceValue(mapping, name, sheet);
    if (value === undefined || value === "" || value === false) continue;
    if (mapping.type === "CheckBox") {
      if (value === true) check(mapping);
    } else draw(mapping, String(value));
  }

  // Privilegi occupy two columns: flow the wrapped lines into the second.
  const privileges = sheet.privilegi.map((item) => `${item.titolo}: ${item.descrizione}`);
  if (privileges.length) {
    const first = byField.get("textarea_140vxzv")!;
    const second = byField.get("textarea_141pxvh")!;
    const lines = wrappedLines(privileges.join("\n"), first.width - 4, 7, measure);
    const perColumn = Math.floor((first.height - 4) / (7 * 1.2));
    draw(first, lines.slice(0, perColumn).join("\n"));
    draw(second, lines.slice(perColumn, perColumn * 2).join("\n"));
  }
  if (sheet.talenti.length) draw(byField.get("textarea_143mcko")!, sheet.talenti.map((item) => `${item.nome}: ${item.descrizione}`).join("\n"));
  if (sheet.equipaggiamento.length) draw(byField.get("textarea_165hxzs")!, sheet.equipaggiamento.map((item) => item.nome).join("\n"));

  return pdf.save();
}

export async function exportTemplatePdf(name: string, sheet: Sheet): Promise<void> {
  const [template, font] = await Promise.all([
    fetch("/scheda-template.pdf"),
    fetch("/pdf-font.otf"),
  ]);
  if (!template.ok || !font.ok) throw new Error("Impossibile caricare il modello PDF");
  const bytes = await buildTemplatePdf(name, sheet, new Uint8Array(await template.arrayBuffer()), new Uint8Array(await font.arrayBuffer()));
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(name || "scheda").replace(/[^\w-]+/g, "_")}_scheda.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
