<script>
  let { name, size = 22 } = $props();

  const paths = {
    week: "M8 2v4M16 2v4M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5Z",
    lineup: "M4 3h16v18H4z|M4 12h16|M9 3v18|M15 3v18",
    schedule: "M8 2v4M16 2v4M3.5 9h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5Z|m8.5 13.5 2 2 4-4",
    presence: "M4 20V10|M11 20V4|M18 20v-7",
    players: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z|M2.5 20c.7-3.4 3.4-5.5 6.5-5.5s5.8 2.1 6.5 5.5|M17 5.2A3.4 3.4 0 0 1 17 12|M20 14.3c1.8.6 3.1 2 3.5 4.2",
    analysis: "M6 3.5h9L19.5 8v12.5H6z|M15 3.5V8h4.5|M9 13h6|M9 16.5h6",
    back: "m14.5 4-8 8 8 8",
    close: "m5 5 14 14M19 5 5 19",
    chevron: "m8 5 8 7-8 7",
  };

  const d = $derived((paths[name] || "").split("|"));
</script>

<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#each d as seg}
    <path d={seg} />
  {/each}
</svg>
