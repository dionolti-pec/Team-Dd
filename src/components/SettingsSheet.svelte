<script>
  import Sheet from "./Sheet.svelte";
  import { store, setEinstellungen } from "../lib/state.svelte.js";
  import { shareFile } from "../lib/share.js";
  import { exportBackup, backupFilename, importBackup } from "../lib/backup.js";

  let { onclose } = $props();

  let fileInput = $state(null);
  let importMsg = $state("");

  function update(field, value) {
    setEinstellungen({ [field]: value });
  }

  function doExport() {
    shareFile(exportBackup(), backupFilename(), (t) => (store.statusText = t));
  }

  function pickImport() {
    importMsg = "";
    fileInput.click();
  }

  async function onFilePicked(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm("Aktuelle Daten auf diesem Gerät mit der Sicherung überschreiben? Das lässt sich nicht rückgängig machen.")) return;
    const text = await file.text();
    const err = importBackup(text);
    if (err) {
      importMsg = err;
      return;
    }
    location.reload();
  }
</script>

<Sheet title="Einstellungen" onclose={onclose}>
  <div class="page">
    <div class="card">
      <div class="card-title">Vereinsdaten</div>
      <div class="field"><label for="s-verein">Verein</label><input id="s-verein" type="text" value={store.einstellungen.verein} oninput={(e) => update("verein", e.target.value)} /></div>
      <div class="row2">
        <div class="field"><label for="s-stufe">Stufe</label><input id="s-stufe" type="text" value={store.einstellungen.stufe} oninput={(e) => update("stufe", e.target.value)} /></div>
        <div class="field"><label for="s-sk">Stärkeklasse</label><input id="s-sk" type="text" value={store.einstellungen.staerkeklasse} oninput={(e) => update("staerkeklasse", e.target.value)} /></div>
      </div>
      <div class="field"><label for="s-gruppe">Gruppe</label><input id="s-gruppe" type="text" value={store.einstellungen.gruppe} oninput={(e) => update("gruppe", e.target.value)} /></div>
      <div class="field"><label for="s-trainer">Trainer</label><input id="s-trainer" type="text" value={store.einstellungen.trainerName} oninput={(e) => update("trainerName", e.target.value)} /></div>
    </div>

    <div class="card">
      <div class="card-title">Training</div>
      <div class="field"><label for="s-tage">Trainingstage</label><input id="s-tage" type="text" value={store.einstellungen.trainingstage} oninput={(e) => update("trainingstage", e.target.value)} /></div>
      <div class="row2">
        <div class="field"><label for="s-von">Beginn</label><input id="s-von" type="time" value={store.einstellungen.trainingBeginn} oninput={(e) => update("trainingBeginn", e.target.value)} /></div>
        <div class="field"><label for="s-bis">Ende</label><input id="s-bis" type="time" value={store.einstellungen.trainingEnde} oninput={(e) => update("trainingEnde", e.target.value)} /></div>
      </div>
      <p class="field-note">Wird für den Kalender-Export im Spielplan-Tab verwendet.</p>
    </div>

    <div class="card">
      <div class="card-title">Daten</div>
      <p class="hint">Alle Daten liegen nur auf diesem Gerät. Sicherungsdatei regelmässig exportieren, um bei Gerätewechsel oder Datenverlust nichts zu verlieren.</p>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn" onclick={doExport}>Sicherung exportieren</button>
        <button class="btn quiet" onclick={pickImport}>Sicherung einlesen</button>
      </div>
      {#if importMsg}<p class="hint" style="color:var(--danger)">{importMsg}</p>{/if}
      <input bind:this={fileInput} type="file" accept="application/json,.json" hidden onchange={onFilePicked} />
    </div>

    <div class="btn-row" style="margin-top:2px">
      <button class="btn solid wide" onclick={onclose}>Fertig</button>
    </div>
  </div>
</Sheet>
