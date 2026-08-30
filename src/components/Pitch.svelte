<script>
  let { stroke = "currentColor" } = $props();
</script>

<svg viewBox="0 0 680 1050" role="img" aria-label="Spielfeld" fill="none" stroke={stroke} stroke-width="3">
  <rect x="16" y="16" width="648" height="1018" />
  <line x1="16" y1="525" x2="664" y2="525" />
  <circle cx="340" cy="525" r="91" />
  <circle cx="340" cy="525" r="4" fill={stroke} stroke="none" />
  <rect x="139" y="869" width="402" height="165" />
  <rect x="249" y="979" width="182" height="55" />
  <circle cx="340" cy="924" r="4" fill={stroke} stroke="none" />
  <path d="M 249 869 A 91 91 0 0 1 431 869" />
  <rect x="139" y="16" width="402" height="165" />
  <rect x="249" y="16" width="182" height="55" />
  <circle cx="340" cy="126" r="4" fill={stroke} stroke="none" />
  <path d="M 249 181 A 91 91 0 0 0 431 181" />
  <path d="M 16 46 A 30 30 0 0 0 46 16" />
  <path d="M 634 16 A 30 30 0 0 0 664 46" />
  <path d="M 16 1004 A 30 30 0 0 1 46 1034" />
  <path d="M 664 1004 A 30 30 0 0 0 634 1034" />
</svg>
