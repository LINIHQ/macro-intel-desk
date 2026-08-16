export default function StatusChip({ color, children }) {
  return (
    <span className="chip" style={{ '--chip-c': color }}>
      {children}
    </span>
  );
}
