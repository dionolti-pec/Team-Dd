<script>
  import Sheet from "../components/Sheet.svelte";
  import KitBadge from "../components/KitBadge.svelte";
  import Icon from "../components/Icon.svelte";
  import { iso, fmtIso } from "../lib/date.js";
  import {
    store, spieler, profil, saveProfil, logs, saveLogs, istVerletzt,
    addPlayer, aendereNummer, entferneSpieler,
  } from "../lib/state.svelte.js";

  let openNr = $state(null);
  let adding = $state(false);
  let addMsg = $state("");
  let addNr = $state("");
  let addVor = $state("");
  let addNach = $state("");

  let form = $state(null);
  let logDatum = $state(iso(new Date()));
  let logText = $state("");
  let numMsg = $state("");

  function open(nr) {
    openNr = nr;
    const p = profil(nr);
    form = { pos: p.pos, fuss: p.fuss, notiz: p.notiz, von: p.verletzt?.von || "", bis: p.verletzt?.bis || "", grund: p.verletzt?.grund || "", nr };
    logDatum = iso(new Date());
    logText = "";
    numMsg = "";
  }
  function close() {
    openNr = null;
    form = null;
  }

  function saveProfile() {
    saveProfil(openNr, { pos: form.pos, fuss: form.fuss, notiz: form.notiz });
  }
  function saveVerletzung() {
    if (!form.von) { store.statusText = "Startdatum fehlt"; return; }
    saveProfil(openNr, { verletzt: { von: form.von, bis: form.bis || "", grund: form.grund.trim() } });
  }
  function clearVerletzung() {
    saveProfil(openNr, { verletzt: null });
    form.von = ""; form.bis = ""; form.grund = "";
  }
  function addLog() {
    const text = logText.trim();
    if (!text) { store.statusText = "Text fehlt"; return; }
    const l = logs(openNr);
    l.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), d: logDatum, t: text });
    saveLogs(openNr, l);
    logText = "";
  }
  function delLog(id) {
    if (!confirm("Diesen Eintrag löschen?")) return;
    saveLogs(openNr, logs(openNr).filter((x) => x.id !== id));
  }
  function saveNumber() {
    const neu = parseInt(form.nr, 10);
    if (!aendereNummer(openNr, neu)) { form.nr = openNr; return; }
    open(neu);
  }
  function remove() {
    const p = spieler(openNr);
    if (!confirm("„" + p[2].split(" ")[0] + "“ (Nr. " + openNr + ") aus dem Kader entfernen?\n\nProfil, Logbuch und alle Einträge dieses Spielers werden gelöscht. Das lässt sich nicht rückgängig machen.")) return;
    entferneSpieler(openNr);
    close();
  }

  function submitAdd() {
    const nr = parseInt(addNr, 10);
    const err = addPlayer(nr, addNach.trim(), addVor.trim());
    if (err) { addMsg = err; return; }
    adding = false;
    addNr = ""; addVor = ""; addNach = "";
  }

  const vstatus = $derived.by(() => {
    if (openNr === null) return "–";
    const v = istVerletzt(openNr, iso(new Date()));
    return v ? "Aktuell abgemeldet" + (v.bis ? " bis " + fmtIso(v.bis) : " (offen)") : "Aktuell im Kader";
  });
</script>

<div class="topbar">
  <p class="eyebrow">Spieler</p>
  <h1>{store.kader.length} im Kader</h1>
</div>

<div class="page">
  <div class="card" style="padding:8px">
    {#each store.kader as [nr, last, first]}
      {@const p = profil(nr)}
      {@const v = istVerletzt(nr, iso(new Date()))}
      {@const l = logs(nr)}
      <button class="pick-row" onclick={() => open(nr)}>
        <KitBadge nr={nr} />
        <span class="name">
          <span class="n1">{first.split(" ")[0]}</span>
          {#if v}
            <span class="n2 warn">Abgemeldet{v.grund ? " — " + v.grund : ""}</span>
          {:else}
            <span class="n2">{[p.pos, p.fuss].filter(Boolean).join(" · ")}</span>
          {/if}
        </span>
        {#if l.length}<span class="meta">{l.length}×</span>{/if}
        <span class="chev"><Icon name="chevron" size={16} /></span>
      </button>
    {/each}
  </div>
  <div class="btn-row"><button class="btn solid wide" onclick={() => { adding = true; addMsg = ""; }}>Spieler hinzufügen</button></div>
</div>

{#if openNr !== null && form}
  {@const e = spieler(openNr)}
  <Sheet title={(e ? e[2].split(" ")[0] : "") + " · Nr. " + openNr} onclose={close}>
    <div class="page">
      <div class="card">
        <div class="card-title">Profil</div>
        <div class="row2">
          <div class="field"><label for="p-nr">Trikotnummer</label><input id="p-nr" type="number" min="1" max="99" bind:value={form.nr} /></div>
          <div class="field" style="justify-content:flex-end"><span class="glabel">&nbsp;</span><button class="btn" onclick={saveNumber}>Nummer übernehmen</button></div>
        </div>
        <div class="row2">
          <div class="field">
            <label for="p-pos">Position</label>
            <select id="p-pos" bind:value={form.pos} onchange={saveProfile}>
              <option value="">–</option>
              <option>Torhüter</option><option>Innenverteidiger</option><option>Aussenverteidiger</option>
              <option>Defensives Mittelfeld</option><option>Zentrales Mittelfeld</option><option>Offensives Mittelfeld</option>
              <option>Flügel</option><option>Stürmer</option>
            </select>
          </div>
          <div class="field">
            <label for="p-fuss">Starker Fuss</label>
            <select id="p-fuss" bind:value={form.fuss} onchange={saveProfile}>
              <option value="">–</option><option>Rechts</option><option>Links</option><option>Beidfüssig</option>
            </select>
          </div>
        </div>
        <div class="field"><label for="p-notiz">Notizen</label><textarea id="p-notiz" placeholder="Stärken, Entwicklungsziele, Besonderes …" bind:value={form.notiz} oninput={saveProfile}></textarea></div>
      </div>

      <div class="card">
        <div class="card-title">Verletzung / Abmeldung <span class="meta">{vstatus}</span></div>
        <div class="row2">
          <div class="field"><label for="p-von">Ab</label><input id="p-von" type="date" bind:value={form.von} /></div>
          <div class="field"><label for="p-bis">Bis (leer = offen)</label><input id="p-bis" type="date" bind:value={form.bis} /></div>
        </div>
        <div class="field"><label for="p-vgrund">Grund</label><input id="p-vgrund" type="text" placeholder="z.B. Bänderriss, Ferien, Schullager" bind:value={form.grund} /></div>
        <div class="btn-row" style="margin-top:12px">
          <button class="btn danger" onclick={saveVerletzung}>Abmelden</button>
          <button class="btn quiet" onclick={clearVerletzung}>Zurückmelden</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Logbuch — neuer Eintrag</div>
        <div class="field"><label for="p-logdatum">Datum</label><input id="p-logdatum" type="date" bind:value={logDatum} /></div>
        <div class="field"><label for="p-logtext">Was ist aufgefallen?</label><textarea id="p-logtext" placeholder="z.B. Sehr gutes Pressing, mutig im Eins-gegen-Eins …" bind:value={logText}></textarea></div>
        <div class="btn-row" style="margin-top:12px"><button class="btn solid wide" onclick={addLog}>Eintrag speichern</button></div>
      </div>

      <div class="card">
        <div class="card-title">Logbuch</div>
        {#each logs(openNr).slice().sort((a, b) => (b.d || "").localeCompare(a.d || "")) as item}
          <div class="entry">
            <div class="when">{fmtIso(item.d)}</div>
            <div class="what">{item.t}</div>
            <button class="btn quiet" style="margin-top:8px" onclick={() => delLog(item.id)}>Löschen</button>
          </div>
        {:else}
          <p class="empty">Noch keine Einträge.</p>
        {/each}
      </div>

      <div class="btn-row"><button class="btn danger wide" onclick={remove}>Spieler aus Kader entfernen</button></div>
    </div>
  </Sheet>
{/if}

{#if adding}
  <Sheet title="Spieler hinzufügen" onclose={() => (adding = false)}>
    <div class="page">
      <div class="field"><label for="add-nr">Trikotnummer</label><input id="add-nr" type="number" min="1" max="99" placeholder="z.B. 23" bind:value={addNr} /></div>
      <div class="field"><label for="add-vor">Vorname</label><input id="add-vor" type="text" placeholder="z.B. Luca" bind:value={addVor} /></div>
      <div class="field"><label for="add-nach">Nachname</label><input id="add-nach" type="text" placeholder="z.B. Bianchi" bind:value={addNach} /></div>
      {#if addMsg}<p class="hint" style="color:var(--danger)">{addMsg}</p>{/if}
      <div class="btn-row" style="margin-top:12px"><button class="btn solid wide" onclick={submitAdd}>Hinzufügen</button></div>
    </div>
  </Sheet>
{/if}

<style>
  .entry { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .entry:last-child { border-bottom: none; }
  .entry .when { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); margin-bottom: 4px; }
  .entry .what { font-size: 14px; line-height: 1.55; white-space: pre-wrap; }
</style>
