<script>
  import KitBadge from "../components/KitBadge.svelte";
  import { fmtIso } from "../lib/date.js";
  import { store, setEinstellungen } from "../lib/state.svelte.js";
  import { praesenz, praesenzText } from "../lib/presence.js";
  import { shareText } from "../lib/share.js";

  let sortBy = $state("quote");

  const result = $derived(praesenz());

  const rows = $derived(
    store.kader
      .map(([nr, last, first]) => {
        const s = result.stat[nr];
        const q = s.moeglich ? s.da / s.moeglich : null;
        return { nr, last, first, s, q };
      })
      .sort((a, b) => {
        if (sortBy === "nr") return a.nr - b.nr;
        if (sortBy === "name") return a.last.localeCompare(b.last, "de");
        const qa = a.q == null ? 2 : a.q, qb = b.q == null ? 2 : b.q;
        return qa - qb || a.nr - b.nr;
      })
  );
</script>

<div class="topbar">
  <p class="eyebrow">Präsenz</p>
  <h1>Trainingsquote</h1>
</div>

<div class="page">
  <div class="card">
    <div class="field">
      <label for="f-start">Zählen ab</label>
      <input id="f-start" type="date" value={store.einstellungen.start} onchange={(e) => setEinstellungen({ start: e.target.value || "2026-08-18" })} />
    </div>
    <div class="field">
      <label for="f-sort">Sortierung</label>
      <select id="f-sort" bind:value={sortBy}>
        <option value="quote">Schwächste zuerst</option>
        <option value="nr">Trikotnummer</option>
        <option value="name">Name</option>
      </select>
    </div>
    <p class="hint">{result.wochen} {result.wochen === 1 ? "erfasste Woche" : "erfasste Wochen"} ab {fmtIso(result.startIso)} · {result.trainings} Trainings gezählt. Verletzungstage zählen nicht gegen den Spieler.</p>
  </div>

  <div class="card" style="padding:8px">
    <table class="pres">
      <thead>
        <tr><th>Spieler</th><th>Training</th><th>Quote</th><th>Match</th><th>V</th></tr>
      </thead>
      <tbody>
        {#each rows as r}
          {@const pct = r.q == null ? null : Math.round(r.q * 100)}
          <tr>
            <td>
              <div class="who2">
                <KitBadge nr={r.nr} />
                <span class="n1">{r.first.split(" ")[0]}</span>
              </div>
            </td>
            <td>{r.s.da}/{r.s.moeglich}</td>
            <td>
              <div class="qt" class:lo={pct != null && pct < 70}>{pct == null ? "–" : pct + "%"}</div>
              <div class="barq"><i class:lo={pct != null && pct < 70} style={"width:" + (pct || 0) + "%"}></i></div>
            </td>
            <td>{r.s.matches}</td>
            <td>{r.s.verletzt || ""}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="btn-row">
    <button class="btn quiet" onclick={() => shareText(praesenzText(), (t) => (store.statusText = t))}>Präsenzliste teilen</button>
  </div>
</div>

<style>
  .pres { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  .pres th, .pres td { padding: 9px 6px; text-align: right; font-size: 13px; border-bottom: 1px solid var(--border); }
  .pres th { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); font-weight: 700; }
  .pres th:first-child, .pres td:first-child { text-align: left; }
  .who2 { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .who2 .n1 { font-size: 13px; font-weight: 700; }
  .qt { font-weight: 800; }
  .qt.lo { color: var(--danger); }
  .barq { height: 4px; border-radius: 2px; background: var(--sunk); margin-top: 4px; width: 100%; overflow: hidden; }
  .barq i { display: block; height: 100%; background: var(--primary); }
  .barq i.lo { background: var(--danger); }
</style>
