<script>
  import Pitch from "../components/Pitch.svelte";
  import { fmtJ, addDays, kwOf } from "../lib/date.js";
  import { store, aufgebot, absenzen, kurzname, DAY_OFF } from "../lib/state.svelte.js";
  import { formation, slotPlan, belegte } from "../lib/formations.js";

  const f = $derived(formation(store.week.auf.form));
  const plan = $derived(slotPlan(store.week.auf.form));
  const belegt = $derived(belegte(store.week.auf.form, store.week.auf.slots));
  const bank = $derived(aufgebot().filter((nr) => !belegt.includes(nr)));
  const abs = $derived(absenzen());
</script>

<div id="sheetA4">
  <div class="a4-fit">
    <div class="a4-inner">
      <div class="a4-h">
        <div class="l">
          <p class="a4-club">Zug 94 · Junioren D-9 · Stärkeklasse 3 · Gruppe 8</p>
          <h1 class="a4-t">Team Dd — Aufstellung</h1>
        </div>
        <div class="a4-r">
          <b>{store.week.spiel.gegner || "—"}</b>
          {fmtJ(addDays(store.monday, DAY_OFF.ma))} · {f.label}
        </div>
      </div>

      <table class="a4-info">
        <tbody>
          <tr><td class="k">Besammlung</td><td class="v">{store.week.spiel.treff || "—"}</td></tr>
          <tr><td class="k">Anpfiff</td><td class="v">{store.week.spiel.zeit || "—"}</td></tr>
          <tr><td class="k">Spielort</td><td class="v">{store.week.spiel.ort || "—"}</td></tr>
        </tbody>
      </table>

      <div class="a4-pitch">
        <Pitch stroke="#9a9c98" />
        <div class="a4-toks">
          {#each plan as slot}
            {@const nr = store.week.auf.slots[slot.i]}
            <div class="a4-tok" style={"left:" + slot.x + "%;top:" + slot.y + "%"}>
              <div class="sq" class:free={nr == null}>{nr == null ? "–" : nr}</div>
              <div class="lb" class:free={nr == null}>{nr == null ? "frei" : kurzname(nr)}</div>
              <div class="ps">{slot.pos}</div>
            </div>
          {/each}
        </div>
      </div>

      <div class="a4-cols">
        <div>
          <h3>Ersatzbank</h3>
          <p class:none={!bank.length}>{bank.length ? bank.map((nr) => nr + " " + kurzname(nr)).join("   ·   ") : "—"}</p>
        </div>
        <div>
          <h3>Absenzen</h3>
          <p class:none={!abs.length}>{abs.length ? abs.map((a) => kurzname(a.nr) + " (" + a.grund + ")").join("   ·   ") : "—"}</p>
        </div>
      </div>

      <p class="a4-foot">
        <span>KW {kwOf(store.monday)} · {belegt.length} aufgestellt · {bank.length} Bank · {abs.length} Absenzen</span>
        <span>Trainer Dion Ramadani</span>
      </p>
    </div>
  </div>
</div>
