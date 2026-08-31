<script>
  import Sheet from "../components/Sheet.svelte";
  import { fromIso, fmtIso, iso, WOTAG } from "../lib/date.js";
  import { spielplan, saveSpielplan, besammlungVon, minusMin, VORLAUF, parsePlan, planText, saisonBilanz } from "../lib/schedule.js";
  import { fillFromSchedule, refreshSpielplan, store } from "../lib/state.svelte.js";
  import { shareText } from "../lib/share.js";
  import { drucke } from "../lib/print.js";

  let editing = $state(null); // game object or {} for new
  let pasting = $state(false);
  let pasteText = $state("");
  let pastePreview = $state("");
  let formMsg = $state("");

  function refresh() {
    refreshSpielplan();
    fillFromSchedule();
  }

  function openNew() {
    editing = { datum: "", heim: true, gegner: "", zeit: "", ort: "", maps: "", besammlung: "", ergebnis: "", snr: "" };
    formMsg = "";
  }
  function openEdit(g) {
    editing = { ...g };
    formMsg = "";
  }
  function save() {
    if (!editing.datum) { formMsg = "Datum fehlt."; return; }
    const list = spielplan();
    if (editing.id) {
      Object.assign(list.find((x) => x.id === editing.id), editing);
    } else {
      list.push({ ...editing, id: cryptoId() });
    }
    saveSpielplan(list);
    editing = null;
    refresh();
  }
  function remove() {
    if (!confirm("Dieses Spiel löschen?")) return;
    saveSpielplan(spielplan().filter((x) => x.id !== editing.id));
    editing = null;
    refresh();
  }
  function cryptoId() {
    return Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function autoBesText() {
    const a = minusMin(editing.zeit, editing.heim ? VORLAUF.heim : VORLAUF.auswaerts);
    return a ? "Automatisch: Besammlung " + a + " (" + (editing.heim ? "Heim, 1 Std." : "auswärts, 45 Min.") + " vor Anpfiff)" : "Anpfiff als hh:mm eingeben, dann wird die Besammlung berechnet.";
  }

  function preview() {
    const g = parsePlan(pasteText);
    pastePreview = g.length ? g.length + " Spiele erkannt: " + g.map((x) => fmtIso(x.datum) + " " + (x.gegner || "?")).join(" · ") : "Keine Spiele erkannt. Prüfe, ob Datum und Uhrzeit in der Zeile stehen.";
  }
  function apply() {
    const neu = parsePlan(pasteText);
    if (!neu.length) { pastePreview = "Keine Spiele erkannt."; return; }
    const alt = spielplan();
    const kennt = new Set(alt.map((x) => x.datum + "|" + (x.zeit || "")));
    const frisch = neu.filter((x) => !kennt.has(x.datum + "|" + (x.zeit || "")));
    saveSpielplan(alt.concat(frisch));
    pasting = false;
    pasteText = "";
    refresh();
    store.statusText = frisch.length + " Spiele übernommen";
  }

  function printA4() {
    drucke("plan", document.getElementById("sheetPlan"));
  }

  const heute = iso(new Date());
  const naechstes = $derived(store.spielplanList.find((g) => g.datum >= heute));
  const bilanz = $derived(saisonBilanz(store.spielplanList));
</script>

<div class="topbar">
  <p class="eyebrow">Spielplan</p>
  <h1>{store.spielplanList.length ? store.spielplanList.length + " Spiele" : "leer"}</h1>
</div>

<div class="page">
  {#if bilanz.gespielt}
    <div class="card">
      <div class="card-title">Saison-Bilanz<span class="meta">{bilanz.toreFuer}:{bilanz.toreGegen} Tore</span></div>
      <div class="bilanz-row">
        <div class="bilanz-item"><b>{bilanz.siege}</b><span>Siege</span></div>
        <div class="bilanz-item"><b>{bilanz.unentschieden}</b><span>Unentsch.</span></div>
        <div class="bilanz-item"><b>{bilanz.niederlagen}</b><span>Niederl.</span></div>
      </div>
    </div>
  {/if}

  {#if !store.spielplanList.length}
    <div class="card"><p class="empty">Noch keine Spiele erfasst.</p></div>
  {:else}
    <div class="card" style="padding:8px">
      {#each store.spielplanList as g}
        {@const d = fromIso(g.datum)}
        {@const bes = besammlungVon(g)}
        <button class="game-row" class:past={g.datum < heute} class:next={naechstes && g.id === naechstes.id} onclick={() => openEdit(g)}>
          <span class="dt">
            <span class="dw">{d ? WOTAG[d.getDay()] : ""}</span>
            <span class="dd">{d ? String(d.getDate()).padStart(2, "0") : "–"}</span>
            <span class="mm">{d ? String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear() : ""}</span>
          </span>
          <span class="mid">
            <span class="opp"><span class="ha" class:h={g.heim}>{g.heim ? "HEIM" : "AUSW"}</span> {g.gegner || "Gegner offen"}</span>
            <span class="det">{[g.ort, g.snr ? "Nr. " + g.snr : ""].filter(Boolean).join(" · ") || "—"}</span>
          </span>
          <span class="rt">
            <span class="tm">{g.zeit || "–"}</span>
            {#if g.ergebnis}<span class="bs res">{g.ergebnis}</span>{:else}<span class="bs">{bes ? "ab " + bes : ""}</span>{/if}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  <p class="hint">Besammlung wird automatisch gesetzt: <b>Heim in Zug 1 Std.</b>, <b>auswärts 45 Min.</b> vor Anpfiff. Beim Antippen eines Spiels lässt sie sich für dieses Spiel überschreiben.</p>

  <div class="btn-row">
    <button class="btn solid" onclick={openNew}>Spiel hinzufügen</button>
    <button class="btn" onclick={() => { pasting = true; pasteText = ""; pastePreview = ""; }}>Aus Match Center einfügen</button>
  </div>
  <div class="btn-row">
    <button class="btn quiet" onclick={() => shareText(planText(), (t) => (store.statusText = t))}>Spielplan teilen</button>
    <button class="btn quiet" onclick={printA4}>Auf A4 drucken</button>
  </div>
</div>

{#if editing}
  <Sheet title={editing.id ? "Spiel bearbeiten" : "Spiel hinzufügen"} onclose={() => (editing = null)}>
    <div class="page">
      <div class="field">
        <label for="sp-datum">Datum</label>
        <input id="sp-datum" type="date" bind:value={editing.datum} />
      </div>
      <div class="field">
        <span class="glabel">Heim oder auswärts</span>
        <div class="seg">
          <button type="button" aria-pressed={editing.heim} onclick={() => (editing.heim = true)}>Heim (Zug)</button>
          <button type="button" aria-pressed={!editing.heim} onclick={() => (editing.heim = false)}>Auswärts</button>
        </div>
      </div>
      <div class="field"><label for="sp-gegner">Gegner</label><input id="sp-gegner" type="text" placeholder="z.B. FC Cham b" bind:value={editing.gegner} /></div>
      <div class="field"><label for="sp-zeit">Anpfiff</label><input id="sp-zeit" type="text" placeholder="14:00" bind:value={editing.zeit} /></div>
      <div class="field"><label for="sp-ort">Spielort</label><input id="sp-ort" type="text" placeholder="z.B. Sportanlage Herti, Zug" bind:value={editing.ort} /></div>
      <div class="field"><label for="sp-maps">Google-Maps-Link</label><input id="sp-maps" type="url" placeholder="https://maps.app.goo.gl/…" bind:value={editing.maps} /></div>
      <div class="field"><label for="sp-bes">Besammlung (leer = automatisch)</label><input id="sp-bes" type="text" bind:value={editing.besammlung} /></div>
      <div class="field"><label for="sp-erg">Resultat (optional)</label><input id="sp-erg" type="text" placeholder="z.B. 3:2" bind:value={editing.ergebnis} /></div>
      <div class="field"><label for="sp-snr">Spielnummer (optional)</label><input id="sp-snr" type="text" placeholder="z.B. 167841" bind:value={editing.snr} /></div>
      <p class="hint">{autoBesText()}</p>
      {#if formMsg}<p class="hint" style="color:var(--danger)">{formMsg}</p>{/if}
      <div class="btn-row" style="margin-top:10px">
        <button class="btn solid" onclick={save}>{editing.id ? "Speichern" : "Hinzufügen"}</button>
        {#if editing.maps}<button class="btn" onclick={() => window.open(editing.maps, "_blank", "noopener")}>Karte öffnen</button>{/if}
        {#if editing.id}<button class="btn danger" onclick={remove}>Löschen</button>{/if}
      </div>
    </div>
  </Sheet>
{/if}

{#if pasting}
  <Sheet title="Aus Match Center einfügen" onclose={() => (pasting = false)}>
    <div class="page">
      <p class="hint">Spielliste im Match Center markieren, kopieren und hier einfügen. Eine Zeile pro Spiel mit Datum, Zeit und beiden Teams.</p>
      <div class="field">
        <textarea placeholder="Sa 06.09.2026 10:00 Zug 94 Dd - FC Cham b   Sportanlage Herti" style="min-height:160px" bind:value={pasteText}></textarea>
      </div>
      {#if pastePreview}<p class="hint">{pastePreview}</p>{/if}
      <div class="btn-row" style="margin-top:10px">
        <button class="btn" onclick={preview}>Vorschau</button>
        <button class="btn solid" onclick={apply}>Übernehmen</button>
      </div>
    </div>
  </Sheet>
{/if}

<style>
  .bilanz-row { display: flex; gap: 8px; }
  .bilanz-item { flex: 1; background: var(--sunk); border-radius: var(--radius-md); padding: 10px 6px; text-align: center; }
  .bilanz-item b { display: block; font-size: 20px; font-weight: 800; }
  .bilanz-item span { font-size: 10.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.04em; }

  .game-row {
    display: grid;
    grid-template-columns: 46px minmax(0, 1fr) auto;
    gap: 0 10px;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    border-radius: var(--radius-md);
    color: var(--text);
    padding: 10px 8px;
    cursor: pointer;
    text-align: left;
  }
  .game-row.next { background: var(--primary-soft); }
  .game-row.past { opacity: 0.5; }
  .game-row .dt { text-align: center; font-variant-numeric: tabular-nums; }
  .game-row .dt > span { display: block; }
  .game-row .dt .dw { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); }
  .game-row .dt .dd { font-size: 18px; font-weight: 800; line-height: 1.05; }
  .game-row .dt .mm { font-size: 9px; color: var(--text-3); }
  .game-row .mid { min-width: 0; }
  .game-row .mid > span { display: block; }
  .game-row .opp { font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .game-row .det { font-size: 11px; color: var(--text-3); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ha { display: inline-block; font-size: 8.5px; font-weight: 800; letter-spacing: 0.06em; padding: 1px 5px; border-radius: 5px; background: var(--sunk); color: var(--text-3); margin-right: 3px; }
  .ha.h { background: var(--primary); color: var(--primary-ink); }
  .game-row .rt { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .game-row .rt > span { display: block; }
  .game-row .rt .tm { font-size: 14px; font-weight: 800; }
  .game-row .rt .bs { font-size: 10px; color: var(--danger); font-weight: 700; }
  .game-row .rt .bs.res { font-size: 12px; color: var(--text-2); }
  .seg { display: flex; border-radius: var(--radius-sm); overflow: hidden; background: var(--sunk); }
  .seg button { flex: 1; background: none; border: none; color: var(--text-2); padding: 11px 6px; font-size: 13px; font-weight: 700; cursor: pointer; }
  .seg button[aria-pressed="true"] { background: var(--primary); color: var(--primary-ink); }
</style>
