export default function SourcePills({ sources }) {
  const list = Array.isArray(sources) ? sources : [];
  const valid = list.filter((s) => s && typeof s.url === 'string' && s.url.startsWith('http'));
  if (!valid.length) return null;

  function rawLabel(s) {
    if (s.label) return s.label;
    try {
      return new URL(s.url).hostname.replace('www.', '');
    } catch {
      return 'source';
    }
  }

  // Strip internal citation-trail noise from labels:
  // "Reuters via Business Recorder" -> "Reuters"
  // "Nikkei via BigGo (Aug 17)" -> "Nikkei (Aug 17)"
  const cleaned = valid.map((s) => {
    const noVia = rawLabel(s)
      .replace(/\s+via\s+[^()]+/i, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    const base = noVia.replace(/\s*\([^)]*\)\s*$/, '').trim() || noVia;
    return { url: s.url, full: noVia, base };
  });

  // Keep the parenthetical qualifier only when needed to tell
  // two links from the same outlet apart.
  const counts = {};
  cleaned.forEach((c) => {
    counts[c.base] = (counts[c.base] || 0) + 1;
  });

  return (
    <div className="src-line">
      <span className="src-line-label">Sources</span>
      {cleaned.map((c, i) => (
        <a key={i} className="src-link" href={c.url} target="_blank" rel="noopener noreferrer">
          {counts[c.base] > 1 ? c.full : c.base}
        </a>
      ))}
    </div>
  );
}
