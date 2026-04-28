import { useLang } from "../contexts/LangContext";
import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { Card, CardHeader, DataTable, Badge, Btn, SearchInput, Avatar, Mono } from "../components/ui";
import PageHeader from "../components/PageHeader";
import TripModal from "./TripModal";

export default function TripsPage() {
  const { trips, users, loading } = useData();
  const { tr } = useLang();
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = trips.filter(t =>
    (t.name || "").toLowerCase().includes(query.toLowerCase()) ||
    (t.destination || "").toLowerCase().includes(query.toLowerCase()) ||
    (t.joinCode || "").toLowerCase().includes(query.toLowerCase())
  );

  const columns = [
    { key: "name", label: "Trip", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500, color: "var(--text)" }}>{v || "Untitled"}</div>
        <Mono dim>{row.id?.slice(0, 14)}…</Mono>
      </div>
    )},
    { key: "destination", label: "Destination", render: v => v || <span style={{ color: "var(--text3)" }}>—</span> },
    { key: "createdBy", label: "Owner", render: v => {
      const owner = users.find(u => u.id === v);
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={owner?.displayName} size={26} />
          <div>
            <div style={{ fontSize: 13, color: "var(--text)" }}>{owner?.displayName || "—"}</div>
            <Mono dim>{v?.slice(0, 8)}…</Mono>
          </div>
        </div>
      );
    }},
    { key: "memberIds", label: "Members", render: v => <Badge variant="blue">{1 + (v?.length || 0)}</Badge> },
    { key: "baseCurrency", label: "Currency", render: v => <Badge>{v || "—"}</Badge> },
    { key: "joinCode", label: "Join Code", render: v => (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent)", letterSpacing: 2, fontWeight: 700 }}>{v || "—"}</span>
    )},
    { key: "_action", label: "", render: (_, row) => (
      <Btn size="sm" onClick={e => { e.stopPropagation(); setSelected(row); }}>{tr.details}</Btn>
    )},
  ];

  return (
    <div>
      <PageHeader title={tr.trips} subtitle={`${trips.length} ${tr.total}`} />
      <div style={{ padding: 28 }}>
        <Card>
          <CardHeader
            title={tr.allTrips}
            count={`${filtered.length} ${tr.shown}`}
            action={<SearchInput value={query} onChange={setQuery} placeholder={tr.searchTrips} />}
          />
          <DataTable loading={loading} columns={columns} rows={filtered} onRowClick={setSelected} emptyIcon="🗺" emptyText="No trips found" />
        </Card>
      </div>
      <TripModal trip={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
