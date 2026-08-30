export const FORMATIONEN = [
  { id: "9-3-4-1", label: "9er · 3-4-1", rows: [{ n: 3, name: "Abwehr" }, { n: 4, name: "Mittelfeld", wide: true }, { n: 1, name: "Sturm" }] },
  { id: "9-3-2-2-1", label: "9er · 3-2-2-1", rows: [{ n: 3, name: "Abwehr" }, { n: 2, name: "Mittelfeld" }, { n: 2, name: "Flügel", wide: true }, { n: 1, name: "Sturm" }] },
  { id: "9-3-3-2", label: "9er · 3-3-2", rows: [{ n: 3, name: "Abwehr" }, { n: 3, name: "Mittelfeld" }, { n: 2, name: "Sturm" }] },
  { id: "9-3-2-3", label: "9er · 3-2-3", rows: [{ n: 3, name: "Abwehr" }, { n: 2, name: "Mittelfeld" }, { n: 3, name: "Sturm" }] },
  { id: "9-4-3-1", label: "9er · 4-3-1", rows: [{ n: 4, name: "Abwehr" }, { n: 3, name: "Mittelfeld" }, { n: 1, name: "Sturm" }] },
  { id: "7-2-3-1", label: "7er · 2-3-1", rows: [{ n: 2, name: "Abwehr" }, { n: 3, name: "Mittelfeld" }, { n: 1, name: "Sturm" }] },
  { id: "7-3-2-1", label: "7er · 3-2-1", rows: [{ n: 3, name: "Abwehr" }, { n: 2, name: "Mittelfeld" }, { n: 1, name: "Sturm" }] },
  { id: "11-4-4-2", label: "11er · 4-4-2", rows: [{ n: 4, name: "Abwehr" }, { n: 4, name: "Mittelfeld" }, { n: 2, name: "Sturm" }] },
  { id: "11-4-3-3", label: "11er · 4-3-3", rows: [{ n: 4, name: "Abwehr" }, { n: 3, name: "Mittelfeld" }, { n: 3, name: "Sturm" }] },
];

export const STD_FORM = "9-3-4-1";
export const ALT_FORM = "9-3-2-2-1";

export function formation(formId) {
  return FORMATIONEN.find((f) => f.id === formId) || FORMATIONEN[0];
}

/** Slot 0 = Torhüter, danach Abwehr → Sturm; Position in % des Feldes. */
export function slotPlan(formId) {
  const f = formation(formId);
  const R = f.rows.length;
  const plan = [{ i: 0, pos: "Torhüter", x: 50, y: 93 }];
  let i = 1;
  f.rows.forEach((row, r) => {
    const y = R > 1 ? 76 - r * (60 / (R - 1)) : 46;
    for (let k = 0; k < row.n; k++) {
      let x;
      if (row.wide && row.n > 1) x = 13 + k * (74 / (row.n - 1));
      else x = ((k + 1) / (row.n + 1)) * 100;
      plan.push({ i: i++, pos: row.name, x, y });
    }
  });
  return plan;
}

export function belegte(formId, slots) {
  return slotPlan(formId)
    .map((s) => slots[s.i])
    .filter((nr) => nr != null);
}
