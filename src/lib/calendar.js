import { store } from "./state.svelte.js";
import { besammlungVon } from "./schedule.js";
import { shareFile } from "./share.js";

const WEEKDAY_ICAL = { di: "TU", do: "TH" };
const WEEKDAY_JS = { di: 2, do: 4 }; // Date.getDay(): So=0 … Sa=6

function pad(n) {
  return String(n).padStart(2, "0");
}
function icsStamp(d) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
}
function nextWeekday(from, targetDow) {
  const d = new Date(from);
  const diff = (targetDow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}
function withTime(d, hhmm) {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  const x = new Date(d);
  x.setHours(h || 0, m || 0, 0, 0);
  return x;
}
function escapeText(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
export function buildICS() {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Team Dd//DE", "CALSCALE:GREGORIAN"];
  const now = new Date();

  Object.entries(WEEKDAY_JS).forEach(([day, dow]) => {
    const start = withTime(nextWeekday(now, dow), store.einstellungen.trainingBeginn);
    const end = withTime(nextWeekday(now, dow), store.einstellungen.trainingEnde);
    lines.push(
      "BEGIN:VEVENT",
      "UID:training-" + day + "@team-dd",
      "DTSTAMP:" + icsStamp(now),
      "DTSTART:" + icsStamp(start),
      "DTEND:" + icsStamp(end),
      "RRULE:FREQ=WEEKLY;BYDAY=" + WEEKDAY_ICAL[day],
      "SUMMARY:" + escapeText("Training " + store.einstellungen.verein + " " + store.einstellungen.stufe),
      "END:VEVENT"
    );
  });

  store.spielplanList.forEach((g) => {
    if (!g.datum || !g.zeit) return;
    const [y, m, d] = g.datum.split("-").map(Number);
    const [hh, mm] = g.zeit.split(":").map(Number);
    const start = new Date(y, m - 1, d, hh || 0, mm || 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const bes = besammlungVon(g);
    const desc = [
      g.heim ? "Heimspiel" : "Auswärtsspiel",
      bes ? "Besammlung " + bes : "",
      g.snr ? "Spielnummer " + g.snr : "",
    ].filter(Boolean).join(" · ");
    lines.push(
      "BEGIN:VEVENT",
      "UID:spiel-" + g.id + "@team-dd",
      "DTSTAMP:" + icsStamp(now),
      "DTSTART:" + icsStamp(start),
      "DTEND:" + icsStamp(end),
      "SUMMARY:" + escapeText((g.heim ? "Heimspiel vs. " : "Auswärts bei ") + (g.gegner || "Gegner offen")),
      "DESCRIPTION:" + escapeText(desc),
      g.ort ? "LOCATION:" + escapeText(g.ort) : "",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export function icsBlob() {
  return new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
}

/**
 * Eine data:-URI-Direktnavigation übernimmt auf iOS zuverlässig nur den
 * ERSTEN Termin einer .ics-Datei und lässt den Rest weg — bei mehreren
 * Terminen (Trainings + Spiele) fehlt dann das meiste. Der zuverlässige Weg
 * für mehrere Termine ist: Datei über "Teilen" sichern, dann aus Dateien
 * öffnen — das zeigt "Alle X Termine hinzufügen".
 */
export function addToCalendar(onStatus) {
  const ics = buildICS();
  shareFile(new Blob([ics], { type: "text/calendar;charset=utf-8" }), "team-dd-kalender.ics", onStatus);
}
