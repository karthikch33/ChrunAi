// textUtils.js
export function toSentences(text = "") {
    const trimmed = String(text || "").trim();
    if (!trimmed) return [];
    // Prefer Intl.Segmenter when available (handles locales & edge cases)
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      try {
        const seg = new Intl.Segmenter("en", { granularity: "sentence" }); // change locale if needed
        return Array.from(seg.segment(trimmed))
          .map((s) => s.segment.trim())
          .filter(Boolean);
      } catch {}
    }
    // Regex fallback: split on ., !, ? followed by whitespace/cap letter or end
    return trimmed
      .split(/(?<=[.!?])\s+(?=[A-Z(0-9“"'])|(?<=[.!?])\s*$/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  