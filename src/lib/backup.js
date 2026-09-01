import { iso } from "./date.js";

export function exportBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    data[k] = localStorage.getItem(k);
  }
  const payload = { app: "team-dd", exportedAt: iso(new Date()), data };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export function backupFilename() {
  return "team-dd-sicherung-" + iso(new Date()) + ".json";
}

/** Gibt null bei Erfolg zurück, sonst eine Fehlermeldung. */
export function importBackup(jsonText) {
  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch (e) {
    return "Datei ist kein gültiges Sicherungs-JSON.";
  }
  if (!payload || typeof payload.data !== "object") {
    return "Datei enthält keine Team-Dd-Sicherung.";
  }
  try {
    Object.entries(payload.data).forEach(([k, v]) => localStorage.setItem(k, v));
  } catch (e) {
    return "Wiederherstellen fehlgeschlagen: " + e.message;
  }
  return null;
}
