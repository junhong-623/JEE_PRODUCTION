import { useLang } from "../contexts/LangContext";
import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { Card, CardHeader, DataTable, Badge, Btn, SearchInput, Avatar, Mono } from "../components/ui";
import PageHeader from "../components/PageHeader";
import UserModal from "./UserModal";

export default function UsersPage() {
  const { users, trips, loading } = useData();
  const { tr } = useLang();
  const [query, setQuery]     = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = users.filter(u =>
    (u.displayName || "").toLowerCase().includes(query.toLowerCase()) ||
    (u.username    || "").toLowerCase().includes(query.toLowerCase()) ||
    (u.email       || "").toLowerCase().includes(query.toLowerCase())
  );

  const tripCount = uid => trips.filter(t => t.createdBy === uid || (t.memberIds || []).includes(uid)).length;

  const columns = [
    { key: "displayName", label: tr.user, render: (v, row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={v || row.username} size={32} />
        <div>
          <div style={{ fontWeight: 500, color: "var(--text)" }}>{v || "—"}</div>
          <Mono dim>@{row.username || "—"}</Mono>
        </div>
      </div>
    )},
    { key: "email",    label: tr.email,    render: v => <Mono>{v || "—"}</Mono> },
    { key: "id",       label: tr.uid,      render: v => <Mono dim>{v?.slice(0,14)}…</Mono> },
    { key: "id",       label: tr.tripsLabel,    render: v => <Badge variant="blue">{tripCount(v)}</Badge> },
    { key: "_action",  label: "",         render: (_, row) => (
      <Btn size="sm" onClick={e => { e.stopPropagation(); setSelected(row); }}>{tr.details}</Btn>
    )},
  ];

  return (
    <div>
      <PageHeader title={tr.users} subtitle={`${users.length} ${tr.registered}`} />
      <div style={{ padding: 28 }}>
        <Card>
          <CardHeader
            title={tr.allUsers}
            count={`${filtered.length} ${tr.shown}`}
            action={<SearchInput value={query} onChange={setQuery} placeholder={tr.searchUsers} />}
          />
          <DataTable loading={loading} columns={columns} rows={filtered} onRowClick={setSelected} emptyIcon="👤" emptyText="No users found" />
        </Card>
      </div>
      <UserModal user={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
