<script>
  import Sheet from "../components/Sheet.svelte";
  import TrainingPicker from "../components/TrainingPicker.svelte";
  import TrainingLive from "../components/TrainingLive.svelte";
  import Icon from "../components/Icon.svelte";
  import { fmtIso } from "../lib/date.js";
  import { KATEGORIEN, alleUebungen, saveUebungen, addUebung } from "../lib/exercises.js";
  import { alleSessions, saveSession, removeSession, fmtDauer } from "../lib/training.js";

  const STORAGE_KEY = "td:live-session";

  let uebungen = $state(alleUebungen());
  let sessions = $state(alleSessions());
  let editing = $state(null);
  let picking = $state(false);
  let live = $state(null); // {uebungen, initial}

  function refresh() {
    uebungen = alleUebungen();
    sessions = alleSessions();
  }

  function resumeIfAny() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.uebungen?.length) {
        live = { uebungen: saved.uebungen, initial: saved };
      }
    } catch (e) {}
  }
  resumeIfAny();

  function openNew() {
    editing = { titel: "", kategorie: KATEGORIEN[0], dauerMin: 5, beschreibung: "" };
  }
  function openEdit(u) {
    editing = { ...u };
  }
  function save() {
    if (!editing.titel.trim()) return;
    const list = alleUebungen();
    if (editing.id) {
      Object.assign(list.find((x) => x.id === editing.id), editing);
      saveUebungen(list);
    } else {
      addUebung(editing);
    }
    editing = null;
    refresh();
  }
  function remove() {
    if (!confirm("Diese Übung löschen?")) return;
    saveUebungen(alleUebungen().filter((x) => x.id !== editing.id));
    editing = null;
    refresh();
  }

  function startSession(gewaehlt) {
    picking = false;
    live = { uebungen: gewaehlt, initial: null };
  }
  function finishSession(result) {
    saveSession(result);
    live = null;
    refresh();
  }
  function exitSession() {
    live = null;
  }
  function delSession(id) {
    if (!confirm("Diesen Trainingseintrag löschen?")) return;
    removeSession(id);
    refresh();
  }
</script>

{#if live}
  <TrainingLive uebungen={live.uebungen} initial={live.initial} onfinish={finishSession} onexit={exitSession} />
{:else}
  <div class="topbar">
    <p class="eyebrow">Training</p>
    <h1>Übungen & Stoppuhr</h1>
  </div>

  <div class="page">
    <div class="btn-row">
      <button class="btn solid wide" onclick={() => (picking = true)}>Training starten</button>
    </div>

    <div class="card" style="padding:8px">
      <div class="card-title" style="padding:8px 8px 4px">Übungsbibliothek<span class="meta">{uebungen.length}</span></div>
      {#if !uebungen.length}
        <p class="empty">Noch keine Übungen angelegt.</p>
      {:else}
        {#each uebungen as u}
          <button class="pick-row" onclick={() => openEdit(u)}>
            <span class="name">
              <span class="n1">{u.titel}</span>
              <span class="n2">{u.kategorie} · {u.dauerMin} Min.</span>
            </span>
            <span class="chev"><Icon name="chevron" size={16} /></span>
          </button>
        {/each}
      {/if}
    </div>
    <div class="btn-row"><button class="btn wide" onclick={openNew}>Übung hinzufügen</button></div>

    <div class="card" style="padding:8px">
      <div class="card-title" style="padding:8px 8px 4px">Trainings-Verlauf<span class="meta">{sessions.length}</span></div>
      {#if !sessions.length}
        <p class="empty">Noch keine abgeschlossenen Trainings.</p>
      {:else}
        {#each sessions.slice().sort((a, b) => (b.datum || "").localeCompare(a.datum || "")).slice(0, 12) as s}
          <div class="session-row">
            <div class="name">
              <span class="n1">{fmtIso(s.datum)} · {fmtDauer(s.gesamtSek)}</span>
              <span class="n2">{s.uebungen.map((u) => u.titel).join(" · ")}</span>
            </div>
            <button class="btn quiet" onclick={() => delSession(s.id)}>Löschen</button>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  {#if picking}
    <TrainingPicker uebungen={uebungen} onclose={() => (picking = false)} onstart={startSession} />
  {/if}

  {#if editing}
    <Sheet title={editing.id ? "Übung bearbeiten" : "Übung hinzufügen"} onclose={() => (editing = null)}>
      <div class="page">
        <div class="field"><label for="u-titel">Titel</label><input id="u-titel" type="text" placeholder="z.B. Passquadrat 4 gegen 2" bind:value={editing.titel} /></div>
        <div class="row2">
          <div class="field">
            <label for="u-kat">Kategorie</label>
            <select id="u-kat" bind:value={editing.kategorie}>
              {#each KATEGORIEN as k}<option value={k}>{k}</option>{/each}
            </select>
          </div>
          <div class="field"><label for="u-dauer">Dauer (Min.)</label><input id="u-dauer" type="number" min="1" max="60" bind:value={editing.dauerMin} /></div>
        </div>
        <div class="field"><label for="u-besch">Beschreibung</label><textarea id="u-besch" placeholder="Aufbau, Ablauf, Coaching-Punkte …" bind:value={editing.beschreibung}></textarea></div>
        <div class="btn-row" style="margin-top:12px">
          <button class="btn solid" onclick={save}>{editing.id ? "Speichern" : "Hinzufügen"}</button>
          {#if editing.id}<button class="btn danger" onclick={remove}>Löschen</button>{/if}
        </div>
      </div>
    </Sheet>
  {/if}
{/if}

<style>
  .session-row { display: flex; align-items: center; gap: 10px; padding: 11px 8px; border-bottom: 1px solid var(--border); }
  .session-row:last-child { border-bottom: none; }
  .session-row .name { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .session-row .n1 { font-size: 13.5px; font-weight: 700; }
  .session-row .n2 { font-size: 11.5px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
