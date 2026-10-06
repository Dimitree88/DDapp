import assert from "node:assert/strict";
import { test } from "node:test";
import { characterStory } from "../lib/characterStory.ts";
import { emptySheet } from "../lib/sheet.ts";

test("ranger languages gained at level 2 appear in that chapter", () => {
  const sheet = emptySheet();
  sheet.classe = "Ranger";
  sheet.livello = "2";
  sheet.lingue = ["Comune", "Draconico", "Elfico", "Primordiale", "Sottocomune"];
  sheet.fontiCompetenze = ["Primordiale", "Sottocomune"].map((value) => ({
    tipo: "lingua", valore: value, fonte: "Privilegio: Esploratore Esperto",
  }));
  const [creation, levelTwo] = characterStory(sheet);
  assert.deepEqual(creation.events.find((event) => event.title === "Scelte le lingue")?.details,
    [{ label: "Comune, Draconico, Elfico" }]);
  assert.deepEqual(levelTwo.events.find((event) => event.title === "Privilegio: Esploratore Esperto")?.details,
    [{ label: "Lingua: Primordiale" }, { label: "Lingua: Sottocomune" }]);
});
