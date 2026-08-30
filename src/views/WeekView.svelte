<script>
  import Sheet from "../components/Sheet.svelte";
  import KitBadge from "../components/KitBadge.svelte";
  import Icon from "../components/Icon.svelte";
  import { fmt, fmtJ, addDays, kwOf } from "../lib/date.js";
  import {
    store, DAYS, DAY_LABEL, DAY_OFF, MARK,
    attOf, setAtt, grundVon, setGrund, istVerletzt, tagIso, counts,
    prevWeek, nextWeek, resetWeek, saveWeek, buildListText, setEinstellungen,
  } from "../lib/state.svelte.js";
  import { shareText } from "../lib/share.js";

  let grundFor = $state(null);

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
  <p class="eyebrow">Zug 94 · Junioren D-9 · Stärkeklasse 3 · Gruppe 8</p>
  <h1>Team Dd</h1>
  <p class="sub">Trainer Dion Ramadani · Training Di / Do</p>
</div>

<div class="page">
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

    <p class="hint" style="margin-top:8px">
      Training: alle <b>dabei</b>, tippen meldet ab. Match: niemand vorausgewählt, tippen bietet auf. Name antippen für <b>Grund</b> der Absenz. Verletzte sind grau und gesperrt.
    </p>
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
