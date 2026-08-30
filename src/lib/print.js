/* A4: auf genau eine Seite skalieren.
   Der Bogen wird versteckt in A4-Breite gemessen; passt er nicht in die
   Seitenhöhe, wird der Inhalt so weit verkleinert, bis er hineinpasst. */
const A4_B = 186, A4_H = 268; // Satzspiegel in mm bei 12 mm Rand, 3 mm Reserve

function mmInPx(v) {
  const d = document.createElement("div");
  d.style.cssText = "position:absolute;visibility:hidden;height:" + v + "mm";
  document.body.appendChild(d);
  const px = d.getBoundingClientRect().height;
  d.remove();
  return px;
}

export function fitSheet(sheetEl) {
  if (!sheetEl) return;
  const fit = sheetEl.querySelector(".a4-fit");
  const inner = sheetEl.querySelector(".a4-inner");
  if (!fit || !inner) return;

  inner.style.width = "100%";
  inner.style.transform = "none";

  const gemerkt = sheetEl.getAttribute("style") || "";
  sheetEl.setAttribute("style", "display:block;position:absolute;left:-10000px;top:0;width:" + A4_B + "mm");
  fit.style.height = "auto";

  const platz = mmInPx(A4_H);
  let k = 1;
  for (let i = 0; i < 4; i++) {
    const hoch = inner.scrollHeight * k;
    if (hoch <= platz + 1) break;
    k = Math.max(0.4, k * (platz / hoch));
    inner.style.width = 100 / k + "%";
    inner.style.transform = "scale(" + k + ")";
  }

  sheetEl.setAttribute("style", gemerkt);
  fit.style.height = A4_H + "mm";
}

export function drucke(modus, sheetEl) {
  document.body.dataset.print = modus;
  fitSheet(sheetEl);
  window.print();
}
