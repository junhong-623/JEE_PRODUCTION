export default function PageHeader({ title, subtitle }) {
  return (
    <div style={{
      padding: "18px 28px", borderBottom: "1px solid var(--border)",
      background: "var(--bg)", position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{subtitle}</div>}
    </div>
  );
}
