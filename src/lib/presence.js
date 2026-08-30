import { addDays, iso, fmtIso } from "./date.js";
import { store, sammleWochen, istVerletzt, DAY_OFF } from "./state.svelte.js";

export function praesenz() {
  const startIso = store.einstellungen.start;
  const wochen = sammleWochen().filter((w) => iso(addDays(w.montag, 6)) >= startIso);

  const stat = {};
  store.kader.forEach(([nr]) => (stat[nr] = { da: 0, moeglich: 0, verletzt: 0, matches: 0 }));
  let trainings = 0;

  wochen.forEach((w) => {
    const att = (w.daten && w.daten.att) || {};
    ["di", "do"].forEach((day) => {
      const dIso = iso(addDays(w.montag, DAY_OFF[day]));
      if (dIso < startIso) return;
      trainings++;
      store.kader.forEach(([nr]) => {
        const s = stat[nr];
        if (istVerletzt(nr, dIso)) { s.verletzt++; return; }
        s.moeglich++;
        if (att[nr + "-" + day] !== "nein") s.da++;
      });
    });
    const mIso = iso(addDays(w.montag, DAY_OFF.ma));
    if (mIso >= startIso) {
      store.kader.forEach(([nr]) => {
        if (att[nr + "-ma"] === "ja") stat[nr].matches++;
      });
    }
  });

  return { stat, trainings, wochen: wochen.length, startIso };
}

export function praesenzText() {
  const { stat, trainings, wochen, startIso } = praesenz();
  const lines = ["Trainingspräsenz ab " + fmtIso(startIso), wochen + " Wochen · " + trainings + " Trainings", ""];
  store.kader
    .slice()
    .map(([nr, last, first]) => {
      const s = stat[nr];
      return { nr, name: first.split(" ")[0], s, q: s.moeglich ? s.da / s.moeglich : null };
    })
    .sort((a, b) => (a.q == null ? 2 : a.q) - (b.q == null ? 2 : b.q) || a.nr - b.nr)
    .forEach((r) => {
      const pct = r.q == null ? "–" : Math.round(r.q * 100) + "%";
      lines.push(r.name + ": " + r.s.da + "/" + r.s.moeglich + " (" + pct + ")" + (r.s.verletzt ? " · " + r.s.verletzt + " verletzt" : ""));
    });
  return lines.join("\n");
}
