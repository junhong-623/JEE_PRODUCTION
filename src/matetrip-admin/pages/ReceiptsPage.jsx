import { useLang } from "../contexts/LangContext";
import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { Card, CardHeader, DataTable, Badge, SearchInput, Mono } from "../components/ui";
import PageHeader from "../components/PageHeader";

export default function ReceiptsPage() {
  const { receipts, loading } = useData();
  const { tr } = useLang();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const allTags = [...new Set(receipts.flatMap(r => r.tags || []))].sort();

  const filtered = receipts.filter(r => {
    const matchQ = !query ||
      (r.restaurantName || "").toLowerCase().includes(query.toLowerCase()) ||
      (r.tripName       || "").toLowerCase().includes(query.toLowerCase());
    const matchT = !tagFilter || (r.tags || []).includes(tagFilter);
    return matchQ && matchT;
  });

  const totalSpend = filtered.reduce((s, r) => s + (r.totalAmount || 0), 0);

  const columns = [
    { key: "restaurantName", label: tr.receipt, render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500, color: "var(--text)" }}>{v || "Expense"}</div>
        <Mono dim>{row.id?.slice(0,10)}…</Mono>
      </div>
    )},
    { key: "tripName",    label: tr.trips,   render: v => <span style={{ fontSize: 13 }}>{v || "—"}</span> },
    { key: "totalAmount", label: tr.amount, render: (v, row) => (
      <Badge variant="green">
        <span style={{ fontFamily: "var(--font-mono)" }}>{v != null ? v.toLocaleString() : "—"} {row.currency || ""}</span>
      </Badge>
    )},
    { key: "date", label: tr.date, render: v => <Mono>{v || "—"}</Mono> },
    { key: "tags", label: tr.tags, render: v => (v?.length ? v.map(t => (
      <Badge key={t} variant="accent" style={{ marginRight: 4 }}>{t}</Badge>
    )) : <span style={{ color: "var(--text3)", fontSize: 12 }}>—</span>) },
    { key: "googleMapLink", label: tr.map, render: v => v ? (
      <a href={v} target="_blank" rel="noopener" style={{ color: "var(--blue)", fontSize: 12 }}>📍 {tr.viewMap}</a>
    ) : null },
  ];

  return (
    <div>
      <PageHeader title={tr.receipts} subtitle={`${receipts.length} ${tr.sampled} · Total ${totalSpend.toLocaleString()}`} />
      <div style={{ padding: 28 }}>
        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <TagChip active={!tagFilter} onClick={() => setTagFilter("")}>All</TagChip>
            {allTags.map(t => (
              <TagChip key={t} active={tagFilter === t} onClick={() => setTagFilter(f => f === t ? "" : t)}>{t}</TagChip>
            ))}
          </div>
        )}
        <Card>
          <CardHeader
            title={tr.allReceipts}
            count={`${filtered.length} ${tr.shown}`}
            action={<SearchInput value={query} onChange={setQuery} placeholder={tr.searchReceipts} />}
          />
          <DataTable loading={loading} columns={columns} rows={filtered.slice(0, 300)} emptyIcon="🧾" emptyText={tr.noReceipts} />
        </Card>
      </div>
    </div>
  );
}

function TagChip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
      background: active ? "var(--accent)" : "var(--surface2)",
      color: active ? "white" : "var(--text2)",
      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      transition: "all 0.15s",
    }}>{children}</button>
  );
}
