import { readJSON, writeJSON } from "./storage.js";
import { neueId } from "./date.js";

export const KATEGORIEN = ["Aufwärmen", "Technik", "Taktik", "Abschluss", "Spielform", "Athletik"];

export function alleUebungen() {
  return readJSON("td:uebungen", []);
}
export function saveUebungen(list) {
  writeJSON("td:uebungen", list);
}
export function addUebung({ titel, kategorie, dauerMin, beschreibung }) {
  const list = alleUebungen();
  list.push({ id: neueId(), titel, kategorie, dauerMin, beschreibung });
  saveUebungen(list);
  return list;
}
export function removeUebung(id) {
  saveUebungen(alleUebungen().filter((u) => u.id !== id));
}
