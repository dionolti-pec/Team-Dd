<script>
  import Sheet from "../components/Sheet.svelte";
  import KitBadge from "../components/KitBadge.svelte";
  import Icon from "../components/Icon.svelte";
  import SettingsSheet from "../components/SettingsSheet.svelte";
  import { fmt, fmtJ, fmtIso, addDays, iso, fromIso, kwOf, WOTAG } from "../lib/date.js";
  import {
    store, DAYS, DAY_LABEL, DAY_OFF, MARK,
    attOf, setAtt, grundVon, setGrund, istVerletzt, tagIso, counts, toggleMaterial,
    prevWeek, nextWeek, resetWeek, saveWeek, buildListText, setEinstellungen, goToTab,
  } from "../lib/state.svelte.js";
  import { shareText } from "../lib/share.js";
  import { naechstesSpiel, besammlungVon } from "../lib/schedule.js";
  import { materialListe, addMaterial } from "../lib/material.js";
  import { praesenz } from "../lib/presence.js";

  let grundFor = $state(null);
  let settingsOpen = $state(false);
  let materialListeState = $state(materialListe());
  let neuesMaterial = $state("");

  const nextGame = $derived(naechstesSpiel());
  const daysUntil = $derived(nextGame ? Math.round((fromIso(nextGame.datum) - fromIso(iso(new Date()))) / 86400000) : null);

  const verletztCount = $derived(store.kader.filter(([nr]) => istVerletzt(nr, iso(new Date()))).length);
  const praesenzQuote = $derived.by(() => {
    const { stat } = praesenz();
    const quoten = Object.values(stat).filter((s) => s.moeglich > 0).map((s) => s.da / s.moeglich);
    if (!quoten.length) return null;
    return Math.round((quoten.reduce((a, b) => a + b, 0) / quoten.length) * 100);
  });

  const QUICK_ACTIONS = [
    { id: "training", label: "Training", icon: "training" },
    { id: "auf", label: "Aufstellung", icon: "lineup" },
    { id: "plan", label: "Spielplan", icon: "schedule" },
    { id: "spl", label: "Spieler", icon: "players" },
  ];

  function fuegeMaterialHinzu() {
    const name = neuesMaterial.trim();
    if (!name) return;
    materialListeState = addMaterial(name);
    neuesMaterial = "";
  }

  function toggle(nr, day) {
    if (attOf(nr, day) === "verletzt") return;
    setAtt(nr, day, attOf(nr, day) === "ja" ? "nein" : "ja");
  }

  function updateSpiel(field, value) {
    store.week.spiel[field] = value;
    saveWeek();
  }
  function updateEinst(field, value) {
    setEinstellungen({ [field]: value });
  }

  function reset() {
    if (!confirm("Alle Einträge dieser Woche zurücksetzen?")) return;
    resetWeek();
  }

  const gruendeFor = (nr) =>
    DAYS.filter((d) => grundVon(nr, d) && attOf(nr, d) === "nein").map((d) => DAY_LABEL[d].slice(0, 2) + ": " + grundVon(nr, d));
</script>

<div class="topbar">
  <div class="topbar-row">
    <div style="min-width:0">
      <p class="eyebrow">
        <span class="seg">{store.einstellungen.verein}</span> · <span class="seg">{store.einstellungen.stufe}</span> · <span class="seg">{store.einstellungen.staerkeklasse}</span> · <span class="seg">{store.einstellungen.gruppe}</span>
      </p>
      <h1>Team Dd</h1>
      <p class="sub">Trainer {store.einstellungen.trainerName} · Training {store.einstellungen.trainingstage}</p>
    </div>
    <button class="gear" onclick={() => (settingsOpen = true)} aria-label="Einstellungen"><Icon name="settings" size={18} /></button>
  </div>
</div>

<div class="page">
  <div class="stat-row">
    <div class="stat-tile">
      <b>{store.kader.length}</b>
      <span>Kader</span>
    </div>
    <div class="stat-tile" class:warn={verletztCount > 0}>
      <b>{verletztCount}</b>
      <span>Verletzt</span>
    </div>
    <div class="stat-tile">
      <b>{praesenzQuote == null ? "–" : praesenzQuote + "%"}</b>
      <span>Ø Präsenz</span>
    </div>
  </div>

  <div class="quick-actions">
    {#each QUICK_ACTIONS as a}
      <button class="qa-item" onclick={() => goToTab(a.id)}>
        <span class="qa-icon"><Icon name={a.icon} size={20} /></span>
        {a.label}
      </button>
    {/each}
  </div>

  {#if nextGame}
    <div class="card next-card">
      <div class="card-title">Nächstes Spiel<span class="meta">{daysUntil === 0 ? "heute" : daysUntil === 1 ? "morgen" : "in " + daysUntil + " Tagen"}</span></div>
      <p class="next-line">
        {fromIso(nextGame.datum) ? WOTAG[fromIso(nextGame.datum).getDay()] + " " : ""}{fmtIso(nextGame.datum)}
        {#if nextGame.zeit}· {nextGame.zeit} Uhr{/if}
        {#if nextGame.gegner}· {nextGame.heim ? "gegen" : "bei"} {nextGame.gegner}{/if}
      </p>
      {#if besammlungVon(nextGame)}<p class="hint" style="padding-top:2px">Besammlung {besammlungVon(nextGame)}</p>{/if}
    </div>
  {/if}

  <div class="card">
    <div class="week-nav">
      <button class="step" onclick={prevWeek} aria-label="Woche zurück">‹</button>
      <div class="lbl">
        <div class="kw">KW {kwOf(store.monday)}</div>
        <div class="rg">{fmt(store.monday)}–{fmtJ(addDays(store.monday, 6))}</div>
      </div>
      <button class="step" onclick={nextWeek} aria-label="Woche vor">›</button>
    </div>
  </div>

  <div class="card">
    <div class="roster-head">
      <div></div>
      {#each DAYS as day}
        {@const c = counts(day)}
        <div class="ch">
          <div class="d" class:m={day === "ma"}>{DAY_LABEL[day].slice(0, 2)}</div>
          <div class="n">{c.ja}/{c.total}{c.verl ? " ·" + c.verl + "V" : ""}</div>
        </div>
      {/each}
    </div>

    {#each store.kader as [nr, last, first]}
      {@const hurt = DAYS.some((d) => attOf(nr, d) === "verletzt")}
      {@const v = istVerletzt(nr, tagIso("ma")) || istVerletzt(nr, tagIso("di"))}
      {@const gruende = gruendeFor(nr)}
      <div class="roster-row" class:hurt>
        <button class="who" onclick={() => (grundFor = nr)}>
          <KitBadge nr={nr} hurt={hurt} />
          <span class="nm">
            <span class="n1">{first.split(" ")[0]}</span>
            {#if v}
              <span class="n2 warn">Abgemeldet{v.grund ? " — " + v.grund : ""}</span>
            {:else if gruende.length}
              <span class="n2 warn">{gruende.join(" · ")}</span>
            {/if}
          </span>
        </button>
        {#each DAYS as day}
          {@const st = attOf(nr, day)}
          <button class="att-cell" data-v={st} disabled={st === "verletzt"} onclick={() => toggle(nr, day)} aria-label={last + " " + DAY_LABEL[day]}>
            {MARK[st]}
          </button>
        {/each}
      </div>
    {/each}

    <p class="hint small" style="margin-top:8px">Tippen wechselt An-/Abwesend · Name tippen = Grund</p>
  </div>

  <div class="card">
    <div class="card-title">Spieltag</div>
    <div class="field">
      <label for="f-gegner">Gegner</label>
      <input id="f-gegner" type="text" placeholder="z.B. FC Cham b" value={store.week.spiel.gegner} oninput={(e) => updateSpiel("gegner", e.target.value)} />
    </div>
    <div class="row2">
      <div class="field">
        <label for="f-zeit">Anpfiff</label>
        <input id="f-zeit" type="text" placeholder="14:00" value={store.week.spiel.zeit} oninput={(e) => updateSpiel("zeit", e.target.value)} />
      </div>
      <div class="field">
        <label for="f-treff">Besammlung</label>
        <input id="f-treff" type="text" placeholder="13:00" value={store.week.spiel.treff} oninput={(e) => updateSpiel("treff", e.target.value)} />
      </div>
    </div>
    <div class="field">
      <label for="f-ort">Spielort</label>
      <input id="f-ort" type="text" placeholder="z.B. Sportplatz Herti, Zug" value={store.week.spiel.ort} oninput={(e) => updateSpiel("ort", e.target.value)} />
    </div>
    <div class="field">
      <label for="f-maps">Google-Maps-Link</label>
      <input id="f-maps" type="url" placeholder="https://maps.app.goo.gl/…" value={store.week.spiel.maps} oninput={(e) => updateSpiel("maps", e.target.value)} />
    </div>
  </div>

  <div class="card">
    <div class="card-title">Material<span class="meta">{Object.keys(store.week.material).length}/{materialListeState.length}</span></div>
    {#each materialListeState as item}
      <button class="mat-row" class:on={!!store.week.material[item]} onclick={() => toggleMaterial(item)}>
        <span class="mat-check" class:on={!!store.week.material[item]}>{#if store.week.material[item]}<Icon name="check" size={13} />{/if}</span>
        {item}
      </button>
    {/each}
    <div class="inline-btn-field" style="margin-top:10px">
      <input type="text" placeholder="Weiteres Element…" bind:value={neuesMaterial} onkeydown={(e) => e.key === "Enter" && fuegeMaterialHinzu()} />
      <button class="btn" onclick={fuegeMaterialHinzu}>Hinzufügen</button>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Textvorlage</div>
    <div class="field">
      <label for="f-gruss">Anrede</label>
      <input id="f-gruss" type="text" placeholder="Hallo Zusammen," value={store.einstellungen.gruss} oninput={(e) => updateEinst("gruss", e.target.value)} />
    </div>
    <div class="field">
      <label for="f-sign">Grussformel</label>
      <input id="f-sign" type="text" placeholder="LG, Dion" value={store.einstellungen.signatur} oninput={(e) => updateEinst("signatur", e.target.value)} />
    </div>
  </div>

  <div class="btn-row">
    <button class="btn solid" onclick={() => shareText(buildListText(), (t) => (store.statusText = t))}>Aufgebot teilen</button>
    <button class="btn quiet" onclick={reset}>Woche zurücksetzen</button>
  </div>
  <p class="status-line">{store.statusText}</p>
</div>

{#if grundFor !== null}
  {@const nr = grundFor}
  {@const p = store.kader.find((x) => x[0] === nr)}
  <Sheet title={p[2].split(" ")[0] + " · KW " + kwOf(store.monday)} onclose={() => (grundFor = null)}>
    <div class="page">
      {#each DAYS as day}
        {@const st = attOf(nr, day)}
        <div class="field">
          <label for={"g-" + day}>
            {DAY_LABEL[day]} {fmt(addDays(store.monday, DAY_OFF[day]))} — {st === "ja" ? "dabei" : st === "verletzt" ? "abgemeldet" : "nicht dabei"}
          </label>
          <input
            id={"g-" + day}
            type="text"
            placeholder={st === "nein" ? "Grund, z.B. krank / Ferien / Schule" : "—"}
            value={grundVon(nr, day)}
            disabled={st !== "nein"}
            oninput={(e) => setGrund(nr, day, e.target.value)}
          />
        </div>
      {/each}
      <div class="btn-row" style="margin-top:14px">
        <button class="btn solid wide" onclick={() => (grundFor = null)}>Fertig</button>
      </div>
    </div>
  </Sheet>
{/if}

{#if settingsOpen}
  <SettingsSheet onclose={() => (settingsOpen = false)} />
{/if}

<style>
  .stat-row { display: flex; gap: 8px; }
  .stat-tile {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 10px 6px;
    text-align: center;
  }
  .stat-tile b { display: block; font-size: 19px; font-weight: 800; line-height: 1.1; }
  .stat-tile span { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-tile.warn b { color: var(--danger); }

  .quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .qa-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 12px 4px;
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text);
    cursor: pointer;
  }
  .qa-item:active { background: var(--sunk); }
  .qa-icon {
    width: 38px;
    height: 38px;
    border-radius: var(--radius-pill);
    background: var(--accent-soft);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .topbar-row { display: flex; align-items: flex-start; gap: 10px; }
  .gear {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-pill);
    background: var(--sunk);
    border: none;
    color: var(--text-2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-top: 2px;
  }
  .next-card { padding-bottom: 14px; border-color: var(--accent); border-width: 1.5px; }
  .next-card .card-title { color: var(--accent); }
  .next-card .card-title span.meta { color: var(--text-2); }
  .next-line { font-size: 14.5px; font-weight: 600; }

  .mat-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: none;
    border: none;
    padding: 9px 2px;
    font-size: 14.5px;
    color: var(--text);
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
  }
  .mat-row:last-of-type { border-bottom: none; }
  .mat-row.on { color: var(--text-3); text-decoration: line-through; text-decoration-color: var(--border-strong); }
  .mat-check {
    flex: none;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 1.5px solid var(--border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-ink);
  }
  .mat-check.on { background: var(--primary); border-color: var(--primary); }
</style>
