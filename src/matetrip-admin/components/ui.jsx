import { useState } from "react";

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 18 }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: "2px solid var(--border)",
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "admin-spin 0.7s linear infinite",
    }} />
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "gray" }) {
  const map = {
    gray:   ["var(--surface3)",    "var(--text3)"],
    green:  ["var(--green-pale)",  "var(--green)"],
    blue:   ["var(--blue-pale)",   "var(--blue)"],
    yellow: ["var(--yellow-pale)", "var(--yellow)"],
    red:    ["var(--red-pale)",    "var(--red)"],
    accent: ["var(--accent-pale)", "var(--accent)"],
  };
  const [bg, color] = map[variant] || map.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      background: bg, color,
    }}>{children}</span>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, variant = "accent" }) {
  const colorMap = {
    accent: "var(--accent)", green: "var(--green)",
    blue: "var(--blue)", yellow: "var(--yellow)",
  };
  const color = colorMap[variant] || colorMap.accent;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", padding: 20, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 30, fontWeight: 700, color, lineHeight: 1, marginBottom: 6 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, color: "var(--text3)" }}>{sub}</div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, count, action }) {
  return (
    <div style={{
      padding: "14px 20px", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
        {title}
        {count != null && (
          <span style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

// ── DataTable ─────────────────────────────────────────────────────────────────
export function DataTable({ columns, rows, onRowClick, loading, emptyIcon = "📭", emptyText = "No data" }) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 52, color: "var(--text3)", gap: 10, fontSize: 13 }}>
        <Spinner /> Loading…
      </div>
    );
  }
  if (!rows?.length) {
    return (
      <div style={{ textAlign: "center", padding: 52, color: "var(--text3)" }}>
        <div style={{ fontSize: 34, marginBottom: 12 }}>{emptyIcon}</div>
        <div style={{ fontSize: 13 }}>{emptyText}</div>
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{
                padding: "10px 18px", fontSize: 11, textTransform: "uppercase",
                letterSpacing: "0.6px", color: "var(--text3)", fontWeight: 600,
                textAlign: "left", borderBottom: "1px solid var(--border)",
                background: "var(--surface2)", whiteSpace: "nowrap",
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <Row key={row.id || i} row={row} columns={columns} onRowClick={onRowClick} isLast={i === rows.length - 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row, columns, onRowClick, isLast }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={() => onRowClick?.(row)}
      style={{ cursor: onRowClick ? "pointer" : "default", background: hovered ? "var(--surface2)" : "transparent", transition: "background 0.1s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {columns.map(col => (
        <td key={col.key} style={{
          padding: "11px 18px", fontSize: 13, color: "var(--text2)",
          borderBottom: isLast ? "none" : "1px solid var(--border)",
          verticalAlign: "middle",
        }}>
          {col.render ? col.render(row[col.key], row) : row[col.key]}
        </td>
      ))}
    </tr>
  );
}

// ── SearchInput ───────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search…" }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        padding: "7px 12px", background: "var(--surface2)",
        border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 6, color: "var(--text)", fontSize: 13,
        outline: "none", width: 200, transition: "border-color 0.15s",
      }}
    />
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "ghost", size = "md", disabled, style: extra = {} }) {
  const [hovered, setHovered] = useState(false);
  const variants = {
    primary: { background: hovered ? "#e85a3a" : "var(--accent)", color: "white",         border: "none" },
    ghost:   { background: hovered ? "var(--surface3)" : "transparent", color: "var(--text2)", border: "1px solid var(--border)" },
    danger:  { background: "var(--red-pale)", color: "var(--red)", border: hovered ? "1px solid var(--red)" : "1px solid transparent" },
  };
  const sizes = {
    sm: { padding: "5px 10px", fontSize: 12 },
    md: { padding: "8px 14px", fontSize: 13 },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 6, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 6,
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
        ...variants[variant], ...sizes[size], ...extra,
      }}>
      {children}
    </button>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, children, width = 560 }) {
  if (!open) return null;
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, animation: "admin-fadeIn 0.15s ease",
      }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border2)",
        borderRadius: 14, padding: 28, width, maxWidth: "95vw",
        maxHeight: "88vh", overflowY: "auto",
        animation: "admin-slideUp 0.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{
            background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--text2)", fontSize: 16, width: 30, height: 30, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── ModalSection ──────────────────────────────────────────────────────────────
export function ModalSection({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{
        fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px",
        color: "var(--text3)", fontWeight: 600,
        paddingBottom: 8, borderBottom: "1px solid var(--border)", marginBottom: 14,
      }}>{title}</div>
      {children}
    </div>
  );
}

// ── DetailGrid ────────────────────────────────────────────────────────────────
export function DetailGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {items.map(({ label, value, mono, color }) => (
        <div key={label}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 3 }}>{label}</div>
          <div style={{
            fontSize: 13, fontWeight: 500,
            color: color || "var(--text)",
            fontFamily: mono ? "var(--font-mono)" : undefined,
            wordBreak: "break-all",
          }}>{value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 32 }) {
  const initial = (name || "?")[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: "var(--accent-pale)", color: "var(--accent)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 700,
    }}>
      {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
    </div>
  );
}

// ── MonoText ─────────────────────────────────────────────────────────────────
export function Mono({ children, dim }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 11,
      color: dim ? "var(--text3)" : "var(--text2)",
    }}>{children}</span>
  );
}

// ── Toast (global) ────────────────────────────────────────────────────────────
let _setToast = null;
export function ToastProvider() {
  const [toast, setToast] = useState(null);
  _setToast = setToast;
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "var(--surface2)", border: `1px solid var(--border2)`,
      borderLeft: `3px solid ${toast.type === "success" ? "var(--green)" : toast.type === "error" ? "var(--red)" : "var(--accent)"}`,
      borderRadius: "var(--radius)", padding: "12px 18px",
      fontSize: 13, color: "var(--text)", maxWidth: 320,
      animation: "admin-slideUp 0.2s ease",
    }}>
      {toast.msg}
    </div>
  );
}
export function showToast(msg, type = "") {
  _setToast?.({ msg, type });
  setTimeout(() => _setToast?.(null), 3000);
}
