import { readJSON, writeJSON } from "./storage.js";
import { neueId, iso } from "./date.js";

export function alleSessions() {
  return readJSON("td:training-sessions", []);
}
export function saveSession({ uebungen, gesamtSek, notiz }) {
  const list = alleSessions();
  list.push({ id: neueId(), datum: iso(new Date()), uebungen, gesamtSek, notiz: notiz || "" });
  writeJSON("td:training-sessions", list);
  return list;
}
export function removeSession(id) {
  writeJSON("td:training-sessions", alleSessions().filter((s) => s.id !== id));
}
export function fmtDauer(sek) {
  const m = Math.floor(sek / 60), s = sek % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
