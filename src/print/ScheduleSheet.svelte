<script>
  import { fromIso, fmtIso, iso, WOTAG } from "../lib/date.js";
  import { besammlungVon } from "../lib/schedule.js";
  import { store } from "../lib/state.svelte.js";

  const heute = iso(new Date());
  const kommend = $derived(store.spielplanList.filter((g) => g.datum >= heute).length);
</script>

<div id="sheetPlan">
  <div class="a4-fit">
    <div class="a4-inner">
      <div class="a4-h">
        <div class="l">
          <p class="a4-club">{store.einstellungen.verein} · {store.einstellungen.stufe} · {store.einstellungen.staerkeklasse} · {store.einstellungen.gruppe}</p>
          <h1 class="a4-t">Team Dd — Spielplan</h1>
        </div>
        <div class="a4-r"><b>{store.spielplanList.length} Spiele</b>Stand {fmtIso(heute)}</div>
      </div>

      <table class="pl-tab">
        <thead>
          <tr>
            <th class="c-dat">Datum</th>
            <th class="c-ha">H / A</th>
            <th>Gegner · Ort</th>
            <th class="c-zeit">Anpfiff</th>
            <th class="c-bes">Besammlung</th>
          </tr>
        </thead>
        <tbody>
          {#each store.spielplanList as g}
            {@const d = fromIso(g.datum)}
            <tr class:past={g.datum < heute}>
              <td class="c-dat">{d ? WOTAG[d.getDay()] + " " : ""}{fmtIso(g.datum)}</td>
              <td class="c-ha">{g.heim ? "Heim" : "Auswärts"}</td>
              <td>
                {g.gegner || "Gegner offen"}
                {#if g.ort}<div class="c-ort">{g.ort}</div>{/if}
                {#if g.ergebnis}<div class="c-ort">Resultat {g.ergebnis}</div>{/if}
                {#if g.snr}<div class="c-snr">Spielnummer {g.snr}</div>{/if}
              </td>
              <td class="c-zeit">{g.zeit || "—"}</td>
              <td class="c-bes">{besammlungVon(g) || "—"}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <p class="pl-note">Besammlung: Heimspiele in Zug 1 Stunde vor Anpfiff, Auswärtsspiele 45 Minuten vor Anpfiff. Abweichungen sind im Plan einzeln vermerkt.</p>
      <p class="a4-foot">
        <span>{kommend} kommende Spiele · {store.spielplanList.length - kommend} gespielt</span>
        <span>Trainer {store.einstellungen.trainerName}</span>
      </p>
    </div>
  </div>
</div>
