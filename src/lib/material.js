import { readJSON, writeJSON } from "./storage.js";

const STD = ["Bälle", "Leibchen", "Hütchen", "Trinkflaschen", "Icetea", "Bananen"];

export function materialListe() {
  return readJSON("td:material-liste", STD);
}
export function addMaterial(name) {
  const l = materialListe();
  if (!name || l.includes(name)) return l;
  const neu = [...l, name];
  writeJSON("td:material-liste", neu);
  return neu;
}
export function removeMaterial(name) {
  const neu = materialListe().filter((m) => m !== name);
  writeJSON("td:material-liste", neu);
  return neu;
}
