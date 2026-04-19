export function normalize(s: string): string {
  if (!s) return '';
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Returns a score between 0 and 1 for how many chars in `query` appear in `text` */
function charIntersectionScore(text: string, query: string): number {
  const tChars = text.split('');
  const remaining = [...tChars];
  let matched = 0;
  for (const c of query) {
    const idx = remaining.indexOf(c);
    if (idx !== -1) {
      matched++;
      remaining.splice(idx, 1);
    }
  }
  return matched / query.length;
}

export function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const nText = normalize(text);
  const nQuery = normalize(query);

  // Direct partial match
  if (nText.includes(nQuery)) return true;

  // Word-by-word fuzzy logic
  const words = nQuery.split(/\s+/);
  return words.every(w => {
    if (nText.includes(w)) return true;

    // Allow 1 letter error for words >= 3 chars (Levenshtein window)
    if (w.length >= 3) {
      for (let i = 0; i <= nText.length - w.length; i++) {
        let diff = 0;
        for (let j = 0; j < w.length; j++) {
          if (nText[i + j] !== w[j]) diff++;
          if (diff > 1) break;
        }
        if (diff <= 1) return true;
      }
    }

    // Character intersection: if 70%+ of query chars appear in text
    if (w.length >= 3 && charIntersectionScore(nText, w) >= 0.7) return true;

    return false;
  });
}
