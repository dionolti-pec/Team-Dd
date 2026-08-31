<script>
  import Sheet from "./Sheet.svelte";

  let { uebungen, onclose, onstart } = $props();

  let picked = $state(new Set());

  function toggle(id) {
    if (picked.has(id)) picked.delete(id);
    else picked.add(id);
    picked = new Set(picked);
  }

  const gesamt = $derived(uebungen.filter((u) => picked.has(u.id)).reduce((s, u) => s + Number(u.dauerMin || 0), 0));

  function start() {
    const gewaehlt = uebungen.filter((u) => picked.has(u.id));
    if (!gewaehlt.length) return;
    onstart(gewaehlt);
  }
</script>

<Sheet title="Training zusammenstellen" onclose={onclose}>
  {#if !uebungen.length}
    <p class="empty">Noch keine Übungen in der Bibliothek. Erst welche anlegen.</p>
  {:else}
    {#each uebungen as u}
      <button class="opt" class:on={picked.has(u.id)} onclick={() => toggle(u.id)}>
        <span>{u.titel}</span>
        <span class="tag">{u.kategorie} · {u.dauerMin} Min.</span>
      </button>
    {/each}
    <div class="page">
      <p class="hint">{picked.size} Übungen ausgewählt · {gesamt} Min. geplant</p>
      <div class="btn-row" style="margin-top:10px">
        <button class="btn solid wide" disabled={!picked.size} onclick={start}>Los geht's</button>
      </div>
    </div>
  {/if}
</Sheet>
