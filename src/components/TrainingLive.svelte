<script>
  import { untrack } from "svelte";
  import Icon from "./Icon.svelte";
  import { fmtDauer } from "../lib/training.js";

  let { uebungen, initial, onfinish, onexit } = $props();

  const STORAGE_KEY = "td:live-session";

  let idx = $state(untrack(() => initial?.idx ?? 0));
  let remaining = $state(untrack(() => initial?.remaining ?? Math.round(uebungen[0].dauerMin * 60)));
  let running = $state(false);
  let totalElapsed = $state(untrack(() => initial?.totalElapsed ?? 0));
  let perExerciseElapsed = $state(untrack(() => initial?.perExerciseElapsed ?? uebungen.map(() => 0)));
  let doneScreen = $state(false);
  let notiz = $state("");

  const current = $derived(uebungen[idx]);
  const totalSek = $derived(Math.round(current.dauerMin * 60));
  const pct = $derived(totalSek ? 1 - remaining / totalSek : 0);
  const RING = 2 * Math.PI * 84;

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ uebungen, idx, remaining, totalElapsed, perExerciseElapsed }));
    } catch (e) {}
  }
  function clearPersisted() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (e) {}
  }
  function signalEnde() {
    beep();
    if (navigator.vibrate) navigator.vibrate([250, 100, 250]);
  }

  $effect(() => {
    const id = setInterval(() => {
      if (!running || doneScreen) return;
      totalElapsed++;
      perExerciseElapsed[idx]++;
      if (remaining > 0) {
        remaining--;
        if (remaining === 0) signalEnde();
      }
      persist();
    }, 1000);
    return () => clearInterval(id);
  });

  function toggleRun() {
    running = !running;
  }
  function resetUebung() {
    remaining = totalSek;
    persist();
  }
  function next() {
    if (idx < uebungen.length - 1) {
      idx++;
      remaining = Math.round(uebungen[idx].dauerMin * 60);
      persist();
    } else {
      running = false;
      doneScreen = true;
      clearPersisted();
    }
  }
  function abbrechen() {
    if (!confirm("Training abbrechen? Der Fortschritt geht verloren.")) return;
    clearPersisted();
    onexit();
  }
  function speichern() {
    onfinish({
      uebungen: uebungen.map((u, i) => ({ id: u.id, titel: u.titel, dauerMin: u.dauerMin, effektivSek: perExerciseElapsed[i] })),
      gesamtSek: totalElapsed,
      notiz,
    });
  }
</script>

<div class="live">
  {#if !doneScreen}
    <div class="live-top">
      <button class="x" onclick={abbrechen} aria-label="Abbrechen"><Icon name="close" size={16} /></button>
      <span class="prog">Übung {idx + 1}/{uebungen.length}</span>
      <span></span>
    </div>

    <div class="ring-wrap">
      <svg viewBox="0 0 200 200" class="ring">
        <circle cx="100" cy="100" r="84" class="ring-bg" />
        <circle cx="100" cy="100" r="84" class="ring-fg" style={"stroke-dasharray:" + RING + ";stroke-dashoffset:" + RING * (1 - pct)} />
      </svg>
      <div class="ring-center">
        <div class="time">{fmtDauer(remaining)}</div>
        <div class="label">{current.titel}</div>
        <div class="cat">{current.kategorie}</div>
      </div>
    </div>

    <div class="controls">
      <button class="ctrl ghost" onclick={resetUebung} aria-label="Zurücksetzen"><Icon name="reset" size={20} /></button>
      <button class="ctrl main" onclick={toggleRun} aria-label={running ? "Pause" : "Start"}>
        <Icon name={running ? "pause" : "play"} size={30} />
      </button>
      <button class="ctrl ghost" onclick={next} aria-label="Nächste Übung"><Icon name="chevron" size={22} /></button>
    </div>
    <p class="hint" style="text-align:center">Gesamt {fmtDauer(totalElapsed)}</p>
  {:else}
    <div class="finish">
      <div class="check"><Icon name="check" size={30} /></div>
      <h2>Training beendet</h2>
      <p class="hint" style="text-align:center">{uebungen.length} Übungen · {fmtDauer(totalElapsed)} gesamt</p>
      <div class="page" style="width:100%">
        <div class="field">
          <label for="tn-notiz">Notiz (optional)</label>
          <textarea id="tn-notiz" placeholder="Was ist aufgefallen?" bind:value={notiz}></textarea>
        </div>
        <div class="btn-row" style="margin-top:14px">
          <button class="btn solid wide" onclick={speichern}>Speichern</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .live {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    padding: calc(16px + env(safe-area-inset-top)) var(--pad) calc(16px + env(safe-area-inset-bottom));
  }
  .live-top { display: flex; align-items: center; justify-content: space-between; }
  .live-top .x { background: var(--sunk); border: none; color: var(--text); width: 34px; height: 34px; border-radius: var(--radius-pill); cursor: pointer; }
  .live-top .prog { font-size: 12px; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.06em; }
  .live-top span:last-child { width: 34px; }

  .ring-wrap { position: relative; flex: 1; display: flex; align-items: center; justify-content: center; }
  .ring { width: min(78vw, 300px); height: min(78vw, 300px); transform: rotate(-90deg); }
  .ring-bg { fill: none; stroke: var(--sunk); stroke-width: 10; }
  .ring-fg { fill: none; stroke: var(--primary); stroke-width: 10; stroke-linecap: round; transition: stroke-dashoffset 1s linear; }
  .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; padding: 0 20px; }
  .time { font-size: 52px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .label { font-size: 16px; font-weight: 700; }
  .cat { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em; }

  .controls { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 10px 0 4px; }
  .ctrl { border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .ctrl.ghost { width: 52px; height: 52px; border-radius: var(--radius-pill); background: var(--sunk); color: var(--text); }
  .ctrl.main { width: 76px; height: 76px; border-radius: var(--radius-pill); background: var(--primary); color: var(--primary-ink); }

  .finish { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; }
  .finish .check { width: 56px; height: 56px; border-radius: var(--radius-pill); background: var(--success-soft); color: var(--success); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
  .finish h2 { font-size: 20px; font-weight: 800; }
</style>
