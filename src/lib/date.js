export const WOTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function mondayOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function fmt(d) {
  return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + ".";
}

export function fmtJ(d) {
  return fmt(d) + d.getFullYear();
}

export function fmtKurz(d) {
  return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0");
}

export function iso(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function fromIso(s) {
  const p = (s || "").split("-");
  if (p.length !== 3) return null;
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return isNaN(d) ? null : d;
}

export function fmtIso(s) {
  const p = (s || "").split("-");
  return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : s || "";
}

export function kwOf(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const first = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
}

export function neueId() {
  return Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}
