<script>
  import Sheet from "../components/Sheet.svelte";
  import Icon from "../components/Icon.svelte";
  import { addDays, fmtIso } from "../lib/date.js";
  import { store, DAY_OFF } from "../lib/state.svelte.js";
  import { allAnalysen, saveAnalysen, buildAnalyseText } from "../lib/analysis.js";
  import { shareText } from "../lib/share.js";

  let list = $state(allAnalysen());
  let openId = $state(null);
  let form = $state(null);

  function refresh() {
    list = allAnalysen();
  }

  function createNew() {
    const a = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      datum: addDays(store.monday, DAY_OFF.ma).toISOString().slice(0, 10),
      gegner: store.week.spiel.gegner || "",
      resultat: "", gut: "", schlecht: "", fokus: "",
    };
    const l = allAnalysen();
    l.push(a);
    saveAnalysen(l);
    open(a.id);
    refresh();
  }
  function open(id) {
    const a = allAnalysen().find((x) => x.id === id);
    if (!a) return;
    openId = id;
    form = { ...a };
  }
  function close() {
    openId = null;
    form = null;
    refresh();
  }
  function save() {
    const l = allAnalysen();
    const a = l.find((x) => x.id === openId);
    if (!a) return;
    Object.assign(a, form);
    saveAnalysen(l);
  }
  function del() {
    if (!confirm("Diese Spielanalyse löschen?")) return;
    saveAnalysen(allAnalysen().filter((x) => x.id !== openId));
    close();
  }

  const sorted = $derived(list.slice().sort((a, b) => (b.datum || "").localeCompare(a.datum || "")));
</script>

<div class="topbar">
  <p class="eyebrow">Analyse</p>
  <h1>Spielanalysen</h1>
</div>

<div class="page">
  <div class="btn-row"><button class="btn solid wide" onclick={createNew}>Neue Spielanalyse</button></div>

  {#if !sorted.length}
    <div class="card"><p class="empty">Noch keine Spielanalyse erfasst.</p></div>
  {:else}
    <div class="card" style="padding:8px">
      {#each sorted as a}
        <button class="pick-row" onclick={() => open(a.id)}>
          <span class="name">
            <span class="n1">{a.gegner || "Ohne Gegner"}</span>
            <span class="n2">{fmtIso(a.datum)}</span>
          </span>
          {#if a.resultat}<span class="meta">{a.resultat}</span>{/if}
          <span class="chev"><Icon name="chevron" size={16} /></span>
        </button>
      {/each}
    </div>
  {/if}
</div>

{#if openId !== null && form}
  <Sheet title={[fmtIso(form.datum), form.gegner].filter(Boolean).join(" · ") || "Neu"} onclose={close}>
    <div class="page">
      <div class="card">
        <div class="card-title">Spiel</div>
        <div class="row2">
          <div class="field"><label for="a-datum">Datum</label><input id="a-datum" type="date" bind:value={form.datum} oninput={save} /></div>
          <div class="field"><label for="a-resultat">Resultat</label><input id="a-resultat" type="text" placeholder="3:2" bind:value={form.resultat} oninput={save} /></div>
        </div>
        <div class="field"><label for="a-gegner">Gegner</label><input id="a-gegner" type="text" placeholder="z.B. FC Cham b" bind:value={form.gegner} oninput={save} /></div>
      </div>

      <div class="card">
        <div class="card-title">Das lief gut</div>
        <textarea placeholder="Was hat funktioniert? Wer ist positiv aufgefallen?" bind:value={form.gut} oninput={save}></textarea>
      </div>
      <div class="card">
        <div class="card-title">Das war schlecht</div>
        <textarea placeholder="Wo lagen die Probleme?" bind:value={form.schlecht} oninput={save}></textarea>
      </div>
      <div class="card">
        <div class="card-title">Fokus fürs Training</div>
        <textarea placeholder="Was üben wir am Dienstag/Donnerstag?" bind:value={form.fokus} oninput={save}></textarea>
      </div>

      <div class="btn-row">
        <button class="btn solid" onclick={() => shareText(buildAnalyseText(form), (t) => (store.statusText = t))}>Analyse teilen</button>
        <button class="btn danger" onclick={del}>Löschen</button>
      </div>
    </div>
  </Sheet>
{/if}
