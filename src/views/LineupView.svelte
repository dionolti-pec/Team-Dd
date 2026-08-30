<script>
  import Pitch from "../components/Pitch.svelte";
  import Sheet from "../components/Sheet.svelte";
  import KitBadge from "../components/KitBadge.svelte";
  import { store, saveWeek, aufgebot, attOf, kurzname } from "../lib/state.svelte.js";
  import { FORMATIONEN, slotPlan, belegte } from "../lib/formations.js";
  import { drucke } from "../lib/print.js";

  let openSlot = $state(null);

  function changeFormation(id) {
    store.week.auf.form = id;
    store.week.auf.slots = {};
    saveWeek();
  }
  function clearAll() {
    if (!confirm("Aufstellung leeren?")) return;
    store.week.auf.slots = {};
    saveWeek();
  }
  function assign(nr) {
    if (openSlot === null) return;
    if (nr == null) {
      delete store.week.auf.slots[openSlot.i];
    } else {
      Object.keys(store.week.auf.slots).forEach((k) => {
        if (store.week.auf.slots[k] === nr) delete store.week.auf.slots[k];
      });
      store.week.auf.slots[openSlot.i] = nr;
    }
    saveWeek();
    openSlot = null;
  }
  function printA4() {
    drucke("auf", document.getElementById("sheetA4"));
  }

  const plan = $derived(slotPlan(store.week.auf.form));
  const gebot = $derived(aufgebot());
  const belegt = $derived(belegte(store.week.auf.form, store.week.auf.slots));
  const bank = $derived(gebot.filter((nr) => !belegt.includes(nr)));
</script>

<div class="topbar">
  <p class="eyebrow">Aufstellung</p>
  <h1>Formation & Feld</h1>
</div>

<div class="page">
  <div class="card">
    <div class="field">
      <label for="f-form">Formation</label>
      <select id="f-form" value={store.week.auf.form} onchange={(e) => changeFormation(e.target.value)}>
        {#each FORMATIONEN as f}
          <option value={f.id}>{f.label}</option>
        {/each}
      </select>
    </div>
    <p class="hint">{plan.length} Positionen · {gebot.length} im Aufgebot</p>
  </div>

  <div class="card">
    <div class="pitchbox">
      <Pitch stroke="var(--text-3)" />
      <div class="tokens">
        {#each plan as slot}
          {@const nr = store.week.auf.slots[slot.i]}
          <button class="tok" class:free={nr == null} style={"left:" + slot.x + "%;top:" + slot.y + "%"} onclick={() => (openSlot = slot)}>
            <span class="sq">{nr == null ? "+" : nr}</span>
            <span class="lb">{nr == null ? slot.pos : kurzname(nr)}</span>
            {#if nr != null}<span class="ps">{slot.pos}</span>{/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Ersatzbank</div>
    <p class="hint">{bank.length ? bank.map((nr) => nr + " " + kurzname(nr)).join(" · ") : "Niemand auf der Bank."}</p>
  </div>

  <div class="btn-row">
    <button class="btn solid" onclick={printA4}>Auf A4 drucken</button>
    <button class="btn quiet" onclick={clearAll}>Leeren</button>
  </div>
</div>

{#if openSlot}
  <Sheet title={openSlot.pos + " besetzen"} onclose={() => (openSlot = null)}>
    <button class="opt" onclick={() => assign(null)}>Position frei lassen</button>
    {#each gebot as nr}
      {#if !belegt.includes(nr) || store.week.auf.slots[openSlot.i] === nr}
        <button class="opt" class:on={store.week.auf.slots[openSlot.i] === nr} onclick={() => assign(nr)}>
          <KitBadge nr={nr} />
          <span>{kurzname(nr)}</span>
          {#if store.week.auf.slots[openSlot.i] === nr}<span class="tag">gesetzt</span>{/if}
        </button>
      {/if}
    {/each}
    {#each store.kader as [nr]}
      {#if !gebot.includes(nr) && (!belegt.includes(nr) || store.week.auf.slots[openSlot.i] === nr) && attOf(nr, "ma") !== "verletzt"}
        <button class="opt" class:on={store.week.auf.slots[openSlot.i] === nr} onclick={() => assign(nr)}>
          <KitBadge nr={nr} />
          <span>{kurzname(nr)}</span>
          <span class="tag">nicht aufgeboten</span>
        </button>
      {/if}
    {/each}
  </Sheet>
{/if}

<style>
  .pitchbox { position: relative; margin: 0 -16px -16px; background: var(--sunk); border-radius: 0 0 var(--radius-lg) var(--radius-lg); overflow: hidden; }
  .pitchbox :global(svg) { display: block; width: 100%; height: auto; }
  .tokens { position: absolute; inset: 0; }
  .tok {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    width: clamp(52px, 15vw, 68px);
  }
  .tok .sq {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-pill);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: var(--primary-ink);
    font-size: 13px;
    font-weight: 800;
  }
  .tok.free .sq { background: var(--surface); color: var(--text-3); border: 1.5px dashed var(--border-strong); }
  .tok .lb { font-size: 10px; font-weight: 700; line-height: 1.1; text-align: center; color: var(--text); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tok.free .lb { color: var(--text-3); font-weight: 500; }
  .tok .ps { font-size: 8px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); }
</style>
