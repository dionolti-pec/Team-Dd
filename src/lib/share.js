export async function shareText(text, onStatus) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    if (onStatus) onStatus("Kopiert");
  } catch (e) {
    window.prompt("Text kopieren (Strg/Cmd+C):", text);
  }
}
