import { readJSON, writeJSON } from "./storage.js";
import { fmtIso } from "./date.js";

export function allAnalysen() {
  return readJSON("td:analysen", []);
}
export function saveAnalysen(list) {
  writeJSON("td:analysen", list);
}
export function buildAnalyseText(a) {
  const l = ["Spielanalyse " + (a.gegner || "") + (a.datum ? " — " + fmtIso(a.datum) : "")];
  if (a.resultat) l.push("Resultat: " + a.resultat);
  if (a.gut) l.push("", "Das lief gut:", a.gut);
  if (a.schlecht) l.push("", "Das war schlecht:", a.schlecht);
  if (a.fokus) l.push("", "Fokus fürs Training:", a.fokus);
  return l.join("\n");
}
