export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function writeJSON(key, value, onSaved) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (onSaved) onSaved("Gespeichert");
    return true;
  } catch (e) {
    if (onSaved) onSaved("Speichern fehlgeschlagen");
    return false;
  }
}
