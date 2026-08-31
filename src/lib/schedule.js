import { readJSON, writeJSON } from "./storage.js";
import { fromIso, fmtIso, iso, neueId, WOTAG } from "./date.js";

export const VORLAUF = { heim: 60, auswaerts: 45 };

/* Meisterschaft Junioren D-9, Stärkeklasse 3, Herbstrunde, Gruppe 8.
   Resultate aus Sicht von Zug 94 d. */
const SPIELPLAN_STD = [
  { datum: "2026-08-22", zeit: "13:00", heim: false, gegner: "FC Küssnacht a/R c", snr: "167826", ergebnis: "4:5" },
  { datum: "2026-08-29", zeit: "10:00", heim: true, gegner: "FC Walchwil D-9", snr: "167828", ergebnis: "3:3" },
  { datum: "2026-09-05", zeit: "15:30", heim: false, gegner: "FC Muotathal", snr: "167841" },
  { datum: "2026-09-19", zeit: "15:30", heim: true, gegner: "FC Baar D9 schwarz", snr: "167855" },
  { datum: "2026-09-26", zeit: "15:45", heim: false, gegner: "FC Aegeri D9-b", snr: "167856" },
  { datum: "2026-10-10", zeit: "12:00", heim: true, gegner: "SC Cham d", snr: "167868" },
  { datum: "2026-10-17", zeit: "13:00", heim: false, gegner: "FC Schattdorf c", snr: "167872" },
  { datum: "2026-10-24", zeit: "13:30", heim: true, gegner: "FC Hünenberg b", snr: "167881" },
];
const SEED_STAND = 2;

/* Neue Spiele aus SPIELPLAN_STD nachziehen, ohne eigene Einträge und
   Änderungen zu überschreiben. Gelöschte Spiele bleiben gelöscht, weil
   der Abgleich nur einmal pro Stand läuft. */
function ergaenzeSeed(l) {
  const stand = readJSON("td:spielplan:stand", 0);
  if (stand >= SEED_STAND) return l;
  const kennt = new Set();
  l.forEach((g) => {
    if (g.snr) kennt.add("n" + g.snr);
    kennt.add("d" + g.datum);
  });
  SPIELPLAN_STD.forEach((g) => {
    if (kennt.has("n" + g.snr) || kennt.has("d" + g.datum)) return;
    l.push(Object.assign({ id: neueId(), ort: "", maps: "", besammlung: "", ergebnis: "" }, g));
  });
  writeJSON("td:spielplan", l);
  writeJSON("td:spielplan:stand", SEED_STAND);
  return l;
}

export function spielplan() {
  let l = readJSON("td:spielplan", null);
  if (l === null) {
    l = SPIELPLAN_STD.map((g) => Object.assign({ id: neueId(), ort: "", maps: "", besammlung: "", ergebnis: "" }, g));
    writeJSON("td:spielplan", l);
    writeJSON("td:spielplan:stand", SEED_STAND);
  } else {
    l = ergaenzeSeed(l);
  }
  return l.slice().sort((a, b) => (a.datum || "").localeCompare(b.datum || "") || (a.zeit || "").localeCompare(b.zeit || ""));
}

export function saveSpielplan(l) {
  writeJSON("td:spielplan", l);
}

export function minusMin(hhmm, min) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || "").trim());
  if (!m) return "";
  let t = Number(m[1]) * 60 + Number(m[2]) - min;
  if (t < 0) t += 1440;
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}

export function besammlungVon(g) {
  if (g.besammlung) return g.besammlung;
  return minusMin(g.zeit, g.heim ? VORLAUF.heim : VORLAUF.auswaerts);
}

export function spielAm(datumIso) {
  return spielplan().find((g) => g.datum === datumIso) || null;
}

export function naechstesSpiel() {
  const heute = iso(new Date());
  return spielplan().find((g) => g.datum >= heute) || null;
}

export function planText() {
  const list = spielplan();
  if (!list.length) return "Spielplan Team Dd — noch keine Spiele erfasst.";
  const l = ["Spielplan Team Dd — Zug 94, D-Junioren", ""];
  list.forEach((g) => {
    const d = fromIso(g.datum);
    const bes = besammlungVon(g);
    l.push((d ? WOTAG[d.getDay()] + " " + fmtIso(g.datum) : g.datum) + " · " + (g.heim ? "Heim" : "Auswärts") + " · " + (g.gegner || "Gegner offen"));
    const zeile2 = [];
    if (g.zeit) zeile2.push("Anpfiff " + g.zeit);
    if (bes) zeile2.push("Besammlung " + bes);
    if (g.ort) zeile2.push(g.ort);
    if (g.snr) zeile2.push("Nr. " + g.snr);
    if (zeile2.length) l.push("   " + zeile2.join(" · "));
    if (g.maps) l.push("   " + g.maps);
  });
  l.push("", "Besammlung: Heim 1 Std., auswärts 45 Min. vor Anpfiff.");
  return l.join("\n");
}

/* Aus dem Match Center kopierte Zeilen einlesen.
   Spalten sind dort durch Tabulatoren oder mehrere Leerzeichen getrennt. */
const WOTAG_RE = /^(?:mo|di|mi|do|fr|sa|so)\.?\s+/i;

function putzeTeam(s) {
  return String(s || "")
    .replace(WOTAG_RE, "")
    .replace(/^[\s.·|,-]+|[\s.·|,-]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parsePlan(text) {
  const treffer = [];
  text.split(/\r?\n/).forEach((zeile) => {
    let z = zeile.replace(/\t/g, "   ").replace(/\s+$/, "");
    if (!z.trim()) return;

    const md = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/.exec(z);
    if (!md) return;
    const jahr = md[3].length === 2 ? 2000 + Number(md[3]) : Number(md[3]);
    const datum = jahr + "-" + String(Number(md[2])).padStart(2, "0") + "-" + String(Number(md[1])).padStart(2, "0");

    const mt = /\b(\d{1,2}):(\d{2})\b/.exec(z);
    const zeit = mt ? String(Number(mt[1])).padStart(2, "0") + ":" + mt[2] : "";

    z = z.replace(new RegExp("[ ]?" + md[0].replace(/\./g, "\\.") + "[ ]?"), " ");
    if (mt) z = z.replace(new RegExp("[ ]?" + mt[0] + "[ ]?"), " ");

    let teile = z.split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);

    for (let i = 0; i < teile.length; i++) {
      if (/^(?:[-–—]|vs\.?)$/i.test(teile[i]) && i > 0 && i < teile.length - 1) {
        teile.splice(i - 1, 3, teile[i - 1] + " - " + teile[i + 1]);
        break;
      }
    }

    const paarIdx = teile.findIndex((t) => /\s[-–—]\s|\svs\.?\s/i.test(t));

    let heim = true, gegner = "", ort = "";
    const istUns = (s) => /zug\s*94/i.test(s);

    if (paarIdx >= 0) {
      const seiten = teile[paarIdx].split(/\s+[-–—]\s+|\s+vs\.?\s+/i);
      const a = putzeTeam(seiten[0]);
      const b = putzeTeam(seiten[1]);
      if (istUns(a) && !istUns(b)) { heim = true; gegner = b; }
      else if (istUns(b)) { heim = false; gegner = a; }
      else { heim = true; gegner = b || a; }
      ort = teile.filter((t, i) => i !== paarIdx && !WOTAG_RE.test(t + " ") && t.length > 2).join(", ");
    } else {
      const kandidaten = teile.filter((t) => !/^(?:mo|di|mi|do|fr|sa|so)\.?$/i.test(t));
      gegner = putzeTeam(kandidaten[0] || "");
      ort = kandidaten.slice(1).join(", ");
      if (istUns(gegner)) gegner = "";
    }

    const snrM = /Spielnummer\s*(\d{4,})/i.exec(zeile);
    const mapM = /(https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|(?:www\.)?google\.[a-z.]+\/maps)\S+)/i.exec(zeile);
    if (!gegner && !zeit) return;
    treffer.push({ id: neueId(), datum, zeit, heim, gegner, ort: ort.trim(), maps: mapM ? mapM[1] : "", besammlung: "", ergebnis: "", snr: snrM ? snrM[1] : "" });
  });
  return treffer;
}

/* Resultate stehen als "eigene:gegner" (Sicht Zug 94, siehe SPIELPLAN_STD oben). */
export function saisonBilanz(list) {
  const b = { siege: 0, unentschieden: 0, niederlagen: 0, toreFuer: 0, toreGegen: 0, gespielt: 0 };
  list.forEach((g) => {
    const m = /^(\d+)\s*:\s*(\d+)$/.exec((g.ergebnis || "").trim());
    if (!m) return;
    const eigene = Number(m[1]), gegner = Number(m[2]);
    b.gespielt++;
    b.toreFuer += eigene;
    b.toreGegen += gegner;
    if (eigene > gegner) b.siege++;
    else if (eigene === gegner) b.unentschieden++;
    else b.niederlagen++;
  });
  return b;
}
