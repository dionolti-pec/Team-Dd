import { readJSON, writeJSON } from "./storage.js";
import { mondayOf, addDays, iso, fromIso, fmtKurz } from "./date.js";
import { STD_FORM, ALT_FORM } from "./formations.js";
import { spielAm, besammlungVon, spielplan } from "./schedule.js";

const KADER_STD = [
  [1, "Abede", "Raee"],
  [2, "Aikens", "Leonidas Patrick"],
  [3, "Beluli", "Arbes"],
  [4, "Brunner", "Mischa"],
  [5, "Dedaj", "Alexander"],
  [6, "El Yagoubi", "Adam"],
  [8, "Etoski", "Emir"],
  [9, "Huggel", "Frederik"],
  [10, "Kostelac", "Lovro Roko"],
  [11, "Mäkäla", "Samuel"],
  [12, "Misic", "Aleksa"],
  [13, "Monk", "Alexandr"],
  [14, "Okbazghi", "Christian"],
  [15, "Payo", "Nevio Sanchez"],
  [16, "Procopio", "Eren Daniele"],
  [17, "Ramadani", "Olti"],
  [18, "Saratz", "Mic-Andri"],
  [19, "Simic", "Jonas"],
  [20, "Singh", "Pravir Partap"],
  [21, "Turoczy", "Elek"],
  [22, "Theuner", "Titus"],
];

export const DAYS = ["di", "do", "ma"];
export const DAY_LABEL = { di: "Dienstag", do: "Donnerstag", ma: "Match" };
export const DAY_OFF = { di: 1, do: 3, ma: 5 };
export const MARK = { ja: "✓", nein: "✗", verletzt: "V" };
const EINST_STD = { start: "2026-08-18", gruss: "Hallo Zusammen,", signatur: "LG, Dion" };

function blankWeek() {
  return { v: 3, att: {}, grund: {}, spiel: { gegner: "", zeit: "", treff: "", ort: "", maps: "" }, auf: { form: STD_FORM, slots: {} } };
}
function weekKey(d) {
  return "td:week:" + iso(d);
}
function profilKey(nr) {
  return "td:profil:" + nr;
}
function logKey(nr) {
  return "td:log:" + nr;
}

export const store = $state({
  kader: KADER_STD.slice(),
  monday: mondayOf(new Date()),
  week: blankWeek(),
  einstellungen: Object.assign({}, EINST_STD, readJSON("td:einstellungen", {})),
  statusText: "Bereit",
  profileTick: 0,
  spielplanList: [],
});

export function refreshSpielplan() {
  store.spielplanList = spielplan();
}

function setStatus(t) {
  store.statusText = t + " · " + new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

export function ladeKader() {
  const stored = readJSON("td:kader", null);
  store.kader = (Array.isArray(stored) && stored.length ? stored : KADER_STD.slice())
    .filter((p) => Array.isArray(p) && p.length === 3)
    .sort((a, b) => a[0] - b[0]);
}
export function speichereKader() {
  store.kader.sort((a, b) => a[0] - b[0]);
  writeJSON("td:kader", store.kader);
}

export function spieler(nr) {
  return store.kader.find((p) => p[0] === nr);
}
export function vorname(nr) {
  const p = spieler(nr);
  return p ? p[2].split(" ")[0] : "";
}
export const kurzname = vorname;

export function profil(nr) {
  const p = readJSON(profilKey(nr), {});
  return { pos: p.pos || "", fuss: p.fuss || "", notiz: p.notiz || "", verletzt: p.verletzt || null };
}
export function saveProfil(nr, patch) {
  const cur = profil(nr);
  writeJSON(profilKey(nr), Object.assign(cur, patch));
  store.profileTick++;
}
export function logs(nr) {
  return readJSON(logKey(nr), []);
}
export function saveLogs(nr, l) {
  writeJSON(logKey(nr), l);
}

export function istVerletzt(nr, datumIso) {
  store.profileTick; // dependency: profile changes must invalidate this
  const v = profil(nr).verletzt;
  if (!v || !v.von) return null;
  if (datumIso < v.von) return null;
  if (v.bis && datumIso > v.bis) return null;
  return v;
}

export function tagIso(day) {
  return iso(addDays(store.monday, DAY_OFF[day]));
}

export function attOf(nr, day) {
  if (istVerletzt(nr, tagIso(day))) return "verletzt";
  const v = store.week.att[nr + "-" + day];
  if (day === "ma") return v === "ja" ? "ja" : "nein";
  return v === "nein" ? "nein" : "ja";
}
export function setAtt(nr, day, val) {
  const k = nr + "-" + day;
  const vorgabe = day === "ma" ? "nein" : "ja";
  if (val === vorgabe) delete store.week.att[k];
  else store.week.att[k] = val;
  saveWeek();
}
export function grundVon(nr, day) {
  return store.week.grund[nr + "-" + day] || "";
}
export function setGrund(nr, day, text) {
  const val = text.trim();
  if (val) store.week.grund[nr + "-" + day] = val;
  else delete store.week.grund[nr + "-" + day];
  saveWeek();
}

export function counts(day) {
  let ja = 0, verl = 0;
  store.kader.forEach(([nr]) => {
    const s = attOf(nr, day);
    if (s === "ja") ja++;
    else if (s === "verletzt") verl++;
  });
  return { ja, total: store.kader.length - verl, verl };
}

export function aufgebot() {
  return store.kader.filter(([nr]) => attOf(nr, "ma") === "ja").map((p) => p[0]);
}
export function absenzen() {
  const out = [];
  store.kader.forEach(([nr]) => {
    const st = attOf(nr, "ma");
    if (st === "verletzt") {
      const v = istVerletzt(nr, tagIso("ma"));
      out.push({ nr, grund: v && v.grund ? v.grund : "abgemeldet" });
    } else if (st === "nein" && store.week.grund[nr + "-ma"]) {
      out.push({ nr, grund: store.week.grund[nr + "-ma"] });
    }
  });
  return out;
}

function fillFromSchedule() {
  const g = spielAm(tagIso("ma"));
  if (!g) return;
  const s = store.week.spiel;
  let changed = false;
  if (!s.gegner && g.gegner) { s.gegner = g.gegner; changed = true; }
  if (!s.zeit && g.zeit) { s.zeit = g.zeit; changed = true; }
  if (!s.ort && g.ort) { s.ort = g.ort; changed = true; }
  if (!s.maps && g.maps) { s.maps = g.maps; changed = true; }
  const bes = besammlungVon(g);
  if (!s.treff && bes) { s.treff = bes; changed = true; }
  if (changed) saveWeek();
}
export { fillFromSchedule };

export function loadWeek() {
  const blank = blankWeek();
  const stored = readJSON(weekKey(store.monday), null);

  if (stored) {
    store.week = {
      v: 3,
      att: stored.att || {},
      grund: stored.grund || {},
      spiel: Object.assign(blank.spiel, stored.spiel),
      auf: Object.assign(blank.auf, stored.auf),
    };
    if (!stored.v || stored.v < 2) {
      store.kader.forEach(([nr]) => {
        const warDabei = (stored.att || {})[nr + "-ma"] !== "nein";
        delete store.week.att[nr + "-ma"];
        if (warDabei) store.week.att[nr + "-ma"] = "ja";
      });
      saveWeek();
    }
    if (store.week.auf.form === ALT_FORM && !Object.keys(store.week.auf.slots).length) {
      store.week.auf.form = STD_FORM;
      saveWeek();
    }
  } else {
    const legacy = readJSON("anwesenheit:" + iso(store.monday), null);
    store.week = blank;
    if (legacy) {
      Object.keys(legacy).forEach((k) => {
        if (k.endsWith("-ma")) { if (legacy[k] === "ja") store.week.att[k] = "ja"; }
        else if (legacy[k] === "nein") { store.week.att[k] = "nein"; }
      });
    }
  }
  fillFromSchedule();
}
export function saveWeek() {
  writeJSON("td:week:" + iso(store.monday), store.week, setStatus);
}

export function prevWeek() {
  store.monday = addDays(store.monday, -7);
  loadWeek();
}
export function nextWeek() {
  store.monday = addDays(store.monday, 7);
  loadWeek();
}
export function resetWeek() {
  store.week = blankWeek();
  saveWeek();
}

export function buildListText() {
  const e = store.einstellungen;
  const s = store.week.spiel;
  const tag = addDays(store.monday, DAY_OFF.ma);

  const lines = [];
  if (e.gruss) lines.push(e.gruss, "");
  lines.push("Aufgebot für das Spiel" + (s.gegner ? " gegen " + s.gegner : "") + " " + fmtKurz(tag) + ":", "");

  aufgebot().forEach((nr) => lines.push(vorname(nr)));

  lines.push("");
  lines.push("Besammlung:" + (s.treff ? " " + s.treff : ""));
  if (s.zeit) lines.push("Spielzeit: " + s.zeit);
  if (s.ort) lines.push("Spielort: " + s.ort);
  if (s.gegner) lines.push("Gegner: " + s.gegner);
  if (s.maps) lines.push("", s.maps);

  const abs = absenzen();
  if (abs.length) {
    lines.push("", "Absenzen:");
    abs.forEach((a) => lines.push(vorname(a.nr) + " — " + a.grund));
  }

  if (e.signatur) lines.push("", e.signatur);
  return lines.join("\n");
}

export function setEinstellungen(patch) {
  Object.assign(store.einstellungen, patch);
  writeJSON("td:einstellungen", store.einstellungen);
}

export function addPlayer(nr, nachname, vorname) {
  if (!nr || nr < 1 || nr > 99) return "Trikotnummer zwischen 1 und 99 eingeben.";
  if (store.kader.some((p) => p[0] === nr)) return "Nummer " + nr + " ist schon vergeben.";
  if (!vorname) return "Vorname fehlt.";
  store.kader.push([nr, nachname || vorname, vorname]);
  speichereKader();
  return null;
}

function alleWeekKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf("td:week:") === 0) keys.push(k);
  }
  return keys;
}

export function aendereNummer(alt, neu) {
  if (!Number.isFinite(neu) || neu < 1 || neu > 99) { setStatus("Nummer 1–99 eingeben"); return false; }
  if (neu === alt) return true;
  if (store.kader.some((p) => p[0] === neu)) { alert("Nummer " + neu + " ist bereits vergeben."); return false; }

  const e = spieler(alt);
  if (!e) return false;
  e[0] = neu;
  speichereKader();

  const verschiebe = (vonKey, nachKey) => {
    try {
      const wert = localStorage.getItem(vonKey);
      if (wert === null) return;
      localStorage.setItem(nachKey, wert);
      localStorage.removeItem(vonKey);
    } catch (err) {}
  };
  verschiebe(profilKey(alt), profilKey(neu));
  verschiebe(logKey(alt), logKey(neu));

  alleWeekKeys().forEach((k) => {
    const w = readJSON(k, null);
    if (!w) return;
    let dirty = false;
    DAYS.forEach((d) => {
      ["att", "grund"].forEach((feld) => {
        if (!w[feld]) return;
        const von = alt + "-" + d, nach = neu + "-" + d;
        if (w[feld][von] != null) { w[feld][nach] = w[feld][von]; delete w[feld][von]; dirty = true; }
      });
    });
    if (w.auf && w.auf.slots) {
      Object.keys(w.auf.slots).forEach((s) => {
        if (w.auf.slots[s] === alt) { w.auf.slots[s] = neu; dirty = true; }
      });
    }
    if (dirty) { try { localStorage.setItem(k, JSON.stringify(w)); } catch (err) {} }
  });

  loadWeek();
  setStatus("Nummer " + alt + " → " + neu);
  return true;
}

export function entferneSpieler(nr) {
  store.kader = store.kader.filter((x) => x[0] !== nr);
  speichereKader();

  try {
    localStorage.removeItem(profilKey(nr));
    localStorage.removeItem(logKey(nr));
  } catch (e) {}

  alleWeekKeys().forEach((k) => {
    const w = readJSON(k, null);
    if (!w) return;
    let dirty = false;
    DAYS.forEach((d) => {
      if (w.att && w.att[nr + "-" + d] != null) { delete w.att[nr + "-" + d]; dirty = true; }
      if (w.grund && w.grund[nr + "-" + d] != null) { delete w.grund[nr + "-" + d]; dirty = true; }
    });
    if (w.auf && w.auf.slots) {
      Object.keys(w.auf.slots).forEach((s) => {
        if (w.auf.slots[s] === nr) { delete w.auf.slots[s]; dirty = true; }
      });
    }
    if (dirty) { try { localStorage.setItem(k, JSON.stringify(w)); } catch (e) {} }
  });

  loadWeek();
  setStatus("Spieler entfernt");
}

export function sammleWochen() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.indexOf("td:week:") === 0) {
      const d = fromIso(k.slice(8));
      if (d) out.push({ montag: d, daten: readJSON(k, null) });
    }
  }
  return out.sort((a, b) => a.montag - b.montag);
}
