import assert from "node:assert/strict";
import { test } from "node:test";
import { characterStory } from "../lib/characterStory.ts";
import { emptySheet } from "../lib/sheet.ts";

test("human species story explains Intraprendente's Heroic Inspiration", () => {
  const sheet = emptySheet();
  sheet.specie = "Umano";
  const [creation] = characterStory(sheet);
  const species = creation.events.find((event) => event.title === "Scelta specie: Umano");
  assert.deepEqual(species?.details.find((item) => item.label === "Privilegio: Intraprendente")?.consequences,
    ["Ottiene Ispirazione Eroica ogni volta che completa un riposo lungo"]);
});

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

test("recorded fixed hit point gain appears in creation and level 2", () => {
  const sheet = emptySheet();
  sheet.classe = "Ranger";
  sheet.livello = "2";
  sheet.puntiFeritaMax = "16";
  sheet.dadiVita = "2d10";
  sheet.storiaPuntiFerita = { iniziali: 10, incrementi: [{ value: 6, method: "fisso" }] };
  const [creation, levelTwo] = characterStory(sheet);
  assert.deepEqual(creation.events.find((event) => event.title === "Determinati i punti ferita iniziali")?.details,
    [{ label: "Punti ferita massimi: 10" }]);
  assert.match(levelTwo.events[0].title, /Valore fisso: 6/);
});

test("prepared spell choices appear at the level when they were made", () => {
  const sheet = emptySheet();
  sheet.classe = "Ranger";
  sheet.livello = "2";
  sheet.storiaIncantesimiPreparati = [
    { livello: 1, nomi: ["Cura ferite", "Passo veloce"] },
    { livello: 2, nomi: ["Colpo intrappolante"] },
  ];
  const [creation, levelTwo] = characterStory(sheet);
  const classEvent = creation.events.find((event) => event.title === "Scelta classe: Ranger");
  assert.deepEqual(classEvent.details.find((item) => item.label === "Privilegio: Incantesimi")?.consequences,
    ["Incantesimi preparati: Cura ferite, Passo veloce"]);
  assert.ok(levelTwo.events.some((event) => event.title === "Incantesimo preparato aggiunto: Colpo intrappolante"));
});

test("automatically received equipment appears under Story and preserves its item list", () => {
  const sheet = emptySheet();
  sheet.eventiStoria = [{
    capitolo: "Creazione personaggio",
    titolo: "Dotazione ricevuta: Dotazione da sacerdote",
    data: "2026-10-07T13:56:07.000Z",
    dettagli: ["Zaino", "Coperta", "Razioni ×7"],
  }];
  const [creation] = characterStory(sheet);
  const receipt = creation.events.find((event) => event.title.startsWith("Dotazione ricevuta: Dotazione da sacerdote"));
  assert.deepEqual(receipt?.details, [{ label: "Zaino" }, { label: "Coperta" }, { label: "Razioni ×7" }]);
});
