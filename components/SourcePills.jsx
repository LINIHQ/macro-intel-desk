export default function SourcePills({ sources }) {
  const list = Array.isArray(sources) ? sources : [];
  const valid = list.filter((s) => s && typeof s.url === 'string' && s.url.startsWith('http'));
  if (!valid.length) return null;

  function labelFor(s) {
    if (s.label) return s.label;
    try {
      return new URL(s.url).hostname.replace('www.', '');
    } catch {
      return 'source';
    }
  }

  return (
    <span className="src-row">
      {valid.map((s, i) => (
        <a key={i} className="src-pill" href={s.url} target="_blank" rel="noopener noreferrer">
          {labelFor(s)} <span className="ext" aria-hidden="true">↗</span>
        </a>
      ))}
    </span>
  );
}
