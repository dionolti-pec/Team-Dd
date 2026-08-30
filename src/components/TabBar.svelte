<script>
  import Icon from "./Icon.svelte";
  import { VIEWS } from "../lib/views.js";

  let { active, onselect } = $props();
</script>

<nav class="tabbar">
  {#each VIEWS as v}
    <button class="tab-item" class:active={active === v.id} onclick={() => onselect(v.id)} aria-current={active === v.id}>
      <span class="tab-icon"><Icon name={v.icon} size={20} /></span>
      {v.label}
    </button>
  {/each}
</nav>
