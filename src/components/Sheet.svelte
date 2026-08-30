<script>
  import Icon from "./Icon.svelte";

  let { title, onclose, children } = $props();

  function onKey(e) {
    if (e.key === "Escape") onclose();
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="veil" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}>
  <div class="sheet">
    <div class="sheet-h">
      <h3>{title}</h3>
      <button class="x" onclick={onclose} aria-label="Schliessen"><Icon name="close" size={14} /></button>
    </div>
    {@render children()}
  </div>
</div>
