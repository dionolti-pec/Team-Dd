<script>
  import Sheet from "./Sheet.svelte";
  import { store, setEinstellungen } from "../lib/state.svelte.js";

  let { onclose } = $props();

  function update(field, value) {
    setEinstellungen({ [field]: value });
  }
</script>

<Sheet title="Einstellungen" onclose={onclose}>
  <div class="page">
    <div class="field"><label for="s-verein">Verein</label><input id="s-verein" type="text" value={store.einstellungen.verein} oninput={(e) => update("verein", e.target.value)} /></div>
    <div class="row2">
      <div class="field"><label for="s-stufe">Stufe</label><input id="s-stufe" type="text" value={store.einstellungen.stufe} oninput={(e) => update("stufe", e.target.value)} /></div>
      <div class="field"><label for="s-sk">Stärkeklasse</label><input id="s-sk" type="text" value={store.einstellungen.staerkeklasse} oninput={(e) => update("staerkeklasse", e.target.value)} /></div>
    </div>
    <div class="field"><label for="s-gruppe">Gruppe</label><input id="s-gruppe" type="text" value={store.einstellungen.gruppe} oninput={(e) => update("gruppe", e.target.value)} /></div>
    <div class="field"><label for="s-trainer">Trainer</label><input id="s-trainer" type="text" value={store.einstellungen.trainerName} oninput={(e) => update("trainerName", e.target.value)} /></div>
    <div class="field"><label for="s-tage">Trainingstage</label><input id="s-tage" type="text" value={store.einstellungen.trainingstage} oninput={(e) => update("trainingstage", e.target.value)} /></div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn solid wide" onclick={onclose}>Fertig</button>
    </div>
  </div>
</Sheet>
