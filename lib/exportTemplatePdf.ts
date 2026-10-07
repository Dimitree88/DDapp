import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import fields from "./pdfTemplateFields.json";
import type { Sheet } from "./sheet";
import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "./abilityBonus";
import { displayedWeaponAttack, weaponAttack } from "./weaponAttack";
import { spellDetails } from "./spells";
import { displayedArmorClass } from "./armorClass";
import { featGrants, grantedPrivileges } from "./characterGrants";
import { operationalReminder } from "./operationalReminders";
import { compareOptionLabels } from "./sortOptions";

type Mapping = (typeof fields)[number];
type RichItem = { title: string; detail?: string };

function compactCastingTime(value: string): string {
  if (value.startsWith("reazione,")) return "reazione";
  if (value.startsWith("azione bonus che ")) return "azione bonus";
  if (value.startsWith("azione (") && value.includes(" o 8 ore")) return "azione / 8 ore";
  return value;
}

function sourceValue(mapping: Mapping, name: string, sheet: Sheet, spells: Sheet["incantesimi"]): string | boolean | undefined {
  const source = mapping.source;
  if (source === "name") return name;
  if (source === "sheet.privilegi" || source === "sheet.talenti" || source === "sheet.equipaggiamento") return undefined;
  if (source === "sheet.specie" && mapping.field === "textarea_142hif") return undefined;
  if (source === "sheet.specie") return sheet.lignaggio || sheet.specie;
  if (source === "sheet.classeArmatura") return displayedArmorClass(sheet);
  if (source === "sheet.puntiFeritaMax") return sheet.puntiFeritaMax;
  if (source === "sheet.classe") return sheet.sottoclasse ? `${sheet.classe} - ${sheet.sottoclasse}` : sheet.classe;
  if (source === "sheet.velocita") return sheet.velocita ? `${sheet.velocita} m` : "";
  if (source === "sheet.competenzeArmi") return [sheet.competenzeArmi.join(", "), sheet.padronanzeArmi?.length ? `Padronanze: ${sheet.padronanzeArmi.join(", ")}` : ""].filter(Boolean).join("; ");
  if (source === "sheet.lingue") return sheet.lingue.join(", ");
  if (source === "sheet.bonusCompetenza") return proficiencyBonus(sheet.livello);
  if (source === "sheet.iniziativa") return initiativeBonus(sheet);
  if (source === "sheet.percezionePassiva") return passivePerception(sheet);
  const car = source.match(/^sheet\.caratteristiche\[abbr=(.+?)\]\.(.+)$/);
  if (car) {
    const item = sheet.caratteristiche.find((c) => c.abbr === car[1]);
    if (item && car[2] === "modificatore") return abilityModifier(item.valore);
    if (item && car[2] === "tsBonus") return savingThrowBonus(sheet, item);
    return item?.[car[2] as keyof typeof item];
  }
  const abilita = source.match(/^sheet\.abilita\[nome=(.+?)\]\.(.+)$/);
  if (abilita) {
    const item = sheet.abilita.find((a) => a.nome.toLocaleLowerCase("it") === abilita[1].toLocaleLowerCase("it"));
    if (item && abilita[2] === "bonus") return abilityBonus(sheet, item);
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
      if (array[3] === "bonus") return displayedWeaponAttack(sheet, item);
      if (array[3] === "danno") return weaponAttack(sheet, item)?.damage;
      const value = item[array[3] as keyof typeof item];
      return typeof value === "number" ? String(value) : value;
    }
    const item = spells[index];
    if (!item) return undefined;
    const detail = spellDetails(item.nome);
    if (array[3] === "livello") return detail?.livello === 0 ? "T" : String(detail?.livello ?? "");
    if (array[3] === "tempo") return detail?.tempo ? compactCastingTime(detail.tempo) : undefined;
    if (array[3] === "gittata") return detail?.gittata;
    if (array[3] === "note") return item.stato === "preparato" || item.stato === "semprePreparato" ? "preparato" : "";
    if (array[3] === "concentrazione") return Boolean(detail?.durata.startsWith("concentrazione"));
    if (array[3] === "rituale") return Boolean(detail?.tempo.includes("rituale"));
    if (array[3] === "materiali") return Boolean(detail?.componenti.includes("M"));
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
  const spells = [...sheet.incantesimi].sort((a, b) =>
    (spellDetails(a.nome)?.livello ?? Infinity) - (spellDetails(b.nome)?.livello ?? Infinity)
    || a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }));
  const draw = (mapping: Mapping, value: string) => {
    const page = pages[mapping.page];
    const width = Math.max(1, mapping.width - 4);
    const multiline = mapping.field.startsWith("textarea_");
    if (multiline || mapping.source.endsWith(".tempo")) {
      let size = 7;
      while (size > 4 && wrappedLines(value, width, size, measure).length * size * 1.2 > mapping.height - 3) size -= 0.5;
      const limit = Math.max(1, Math.floor((mapping.height - 3) / (size * 1.2)));
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
  const drawRichList = (boxes: Mapping[], items: RichItem[]) => {
    if (!items.length) return;
    const space = Math.min(...boxes.map((box) => box.height - 4));
    const measureItem = (item: RichItem, box: Mapping, size: number) => {
      const detailSize = size * 0.84;
      const title = wrappedLines(`- ${item.title}`, box.width - 4, size, measure);
      const detail = item.detail ? wrappedLines(item.detail, box.width - 12, detailSize, measure) : [];
      return { title, detail, height: title.length * size * 1.2 + detail.length * detailSize * 1.2 + 2 };
    };
    const layoutFor = (list: RichItem[], size: number) => {
      const heights = list.map((item) => measureItem(item, boxes[0], size).height);
      if (boxes.length === 1 || list.length < 2) return { cut: list.length, used: heights.reduce((total, height) => total + height, 0) };
      return Array.from({ length: list.length - 1 }, (_, index) => index + 1)
        .map((index) => ({ cut: index, used: Math.max(
          heights.slice(0, index).reduce((a, b) => a + b, 0),
          heights.slice(index).reduce((a, b) => a + b, 0),
        ) })).sort((a, b) => a.used - b.used)[0];
    };
    let visibleItems = items;
    let chosenSize = 4.5;
    let chosenCut = items.length;
    let used = Infinity;
    for (let size = 10.5; size >= 4.5; size -= 0.5) {
      const layout = layoutFor(items, size);
      chosenSize = size;
      chosenCut = layout.cut;
      used = layout.used;
      if (used <= space) break;
    }
    if (used > space) {
      visibleItems = items.map((item) => ({ ...item }));
      while (used > space) {
        const longest = visibleItems.reduce((best, item, index) =>
          (item.detail?.length ?? 0) > (visibleItems[best]?.detail?.length ?? 0) ? index : best, 0);
        if (!visibleItems[longest]?.detail) break;
        visibleItems[longest].detail = undefined;
        const layout = layoutFor(visibleItems, chosenSize);
        chosenCut = layout.cut;
        used = layout.used;
      }
    }
    boxes.forEach((box, column) => {
      const page = pages[box.page];
      let top = box.y + 2;
      const selected = boxes.length === 1 ? visibleItems : column === 0 ? visibleItems.slice(0, chosenCut) : visibleItems.slice(chosenCut);
      for (const item of selected) {
        const layout = measureItem(item, box, chosenSize);
        if (top + layout.height > box.y + box.height) break;
        for (const line of layout.title) {
          page.drawText(line, { x: box.x + 2, y: page.getHeight() - top - chosenSize, size: chosenSize, font, color: rgb(0, 0, 0) });
          top += chosenSize * 1.2;
        }
        const detailSize = chosenSize * 0.84;
        for (const line of layout.detail) {
          page.drawText(line, { x: box.x + 10, y: page.getHeight() - top - detailSize, size: detailSize, font, color: rgb(0.55, 0.12, 0.1) });
          top += detailSize * 1.2;
        }
        top += 2;
      }
    });
  };
  const drawFittedParagraph = (box: Mapping, value: string, maxSize = 10.5, bottomPadding = 4) => {
    const page = pages[box.page];
    let size = maxSize;
    let lines = wrappedLines(value, box.width - 4, size, measure);
    while (size > 4.5 && lines.length * size * 1.2 > box.height - bottomPadding) {
      size -= 0.5;
      lines = wrappedLines(value, box.width - 4, size, measure);
    }
    lines.slice(0, Math.floor((box.height - bottomPadding) / (size * 1.2))).forEach((line, index) =>
      page.drawText(line, { x: box.x + 2, y: page.getHeight() - box.y - 2 - size - index * size * 1.2, size, font, color: rgb(0, 0, 0) }));
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
    const value = sourceValue(mapping, name, sheet, spells);
    if (value === undefined || value === "" || value === false) continue;
    if (mapping.type === "CheckBox") {
      if (value === true) check(mapping);
    } else draw(mapping, String(value));
  }

  const grants = grantedPrivileges(sheet);
  const sameName = (a: string, b: string) => a.localeCompare(b, "it", { sensitivity: "base" }) === 0;
  const recordedPrivileges = sheet.privilegi.filter((item) => !grants.some((grant) => sameName(item.titolo, grant.name)));
  const richItem = (title: string, choices?: string): RichItem => ({
    title: `${title}${choices ? `: ${choices}` : ""}`,
    detail: operationalReminder(title, sheet)?.parts.map((part) => typeof part === "string" ? part : part.spell).join(""),
  });
  const grantItem = (grant: (typeof grants)[number]) => richItem(grant.name, sheet.privilegi.find((item) => sameName(item.titolo, grant.name))?.scelte);
  const privileges = [
    ...grants.filter((grant) => !grant.source.startsWith("Specie:") && !grant.source.startsWith("Lignaggio:")).map(grantItem),
    ...recordedPrivileges.map((item) => richItem(item.titolo, item.scelte)),
  ];
  drawRichList([byField.get("textarea_140vxzv")!, byField.get("textarea_141pxvh")!], privileges);
  const species = grants.filter((grant) => grant.source.startsWith("Specie:") || grant.source.startsWith("Lignaggio:"));
  drawRichList([{ ...byField.get("textarea_143mcko")!, x: 228, width: 178, source: "sheet.specie" }], species.map(grantItem));
  const recordedFeats = [...sheet.talenti];
  const feats = featGrants(sheet).map((grant) => {
    const index = recordedFeats.findIndex((item) => sameName(item.nome, grant.name));
    const saved = index >= 0 ? recordedFeats.splice(index, 1)[0] : null;
    return richItem(saved?.nome ?? grant.name, saved?.scelte);
  });
  feats.push(...recordedFeats.map((item) => richItem(item.nome, item.scelte)));
  drawRichList([byField.get("textarea_143mcko")!], feats);
  const quantity = (value?: string) => Number(value) > 1 ? ` x${value}` : "";
  drawRichList([byField.get("textarea_165hxzs")!], [...sheet.equipaggiamento].sort((a, b) => compareOptionLabels(a.nome, b.nome)).map((item) => ({
    title: `${item.nome}${quantity(item.quantita)}${Number(item.quantita) > 1 && item.unita ? ` ${item.unita}` : ""}${item.indossato ? " (indossata)" : item.impugnato ? " (impugnato)" : ""}`,
  })));
  if (sheet.competenzeStrumenti?.length) {
    const box = { ...byField.get("textarea_158mwcp")!, x: 19, y: 730, width: 187, height: 32, source: "sheet.competenzeStrumenti" };
    drawFittedParagraph(box, [...sheet.competenzeStrumenti].sort(compareOptionLabels).join(", "), 7.5, 10);
  }
  if (sheet.note?.trim()) drawFittedParagraph({ ...byField.get("textarea_165hxzs")!, x: 413, y: 139, width: 175, height: 140, source: "sheet.note" }, sheet.note.trim());

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
