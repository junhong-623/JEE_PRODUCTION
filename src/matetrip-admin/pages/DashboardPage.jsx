import { useLang } from "../contexts/LangContext";
import { useData } from "../contexts/DataContext";
import { StatCard, Card, CardHeader, DataTable, Badge, Avatar, Mono } from "../components/ui";
import PageHeader from "../components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import TripModal from "./TripModal";
import UserModal from "./UserModal";

export default function DashboardPage() {
  const { trips, users, receipts, push, loading } = useData();
  const { tr } = useLang();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Currency spend breakdown
  const currencySpend = Object.entries(
    receipts.reduce((acc, r) => {
      const key = r.currency || "—";
      acc[key] = (acc[key] || 0) + (r.totalAmount || 0);
      return acc;
    }, {})
  ).map(([currency, total]) => ({ currency, total: Math.round(total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Trips by member count
  const memberBuckets = { "1": 0, "2–3": 0, "4–6": 0, "7+": 0 };
  trips.forEach(t => {
    const n = 1 + (t.memberIds?.length || 0);
    if (n === 1) memberBuckets["1"]++;
    else if (n <= 3) memberBuckets["2–3"]++;
    else if (n <= 6) memberBuckets["4–6"]++;
    else memberBuckets["7+"]++;
  });
  const memberData = Object.entries(memberBuckets).map(([size, count]) => ({ size, count }));

  const totalSpend = receipts.reduce((s, r) => s + (r.totalAmount || 0), 0);

  return (
    <div>
      <PageHeader title={tr.dashboard} subtitle={tr.dashboardSub} />

      <div style={{ padding: 28 }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          <StatCard label={tr.totalTrips}   value={trips.length}    sub={tr.allTime}       variant="accent" />
          <StatCard label={tr.registeredUsers} value={users.length} sub={tr.registered}    variant="green" />
          <StatCard label={tr.totalReceipts}  value={receipts.length} sub={tr.sampled}     variant="blue" />
          <StatCard label={tr.pushSubs}     value={push.length}     sub={tr.activeDevices} variant="yellow" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card>
            <CardHeader title={tr.spendByCurrency} />
            <div style={{ padding: "16px 8px 8px" }}>
              {currencySpend.length ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={currencySpend} barSize={28}>
                    <XAxis dataKey="currency" tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text3)", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "var(--text)" }}
                      cursor={{ fill: "rgba(255,107,74,0.08)" }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {currencySpend.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "var(--accent)" : "var(--surface3)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 13 }}>No receipt data yet</div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title={tr.tripSizeDist} />
            <div style={{ padding: "16px 8px 8px" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={memberData} barSize={36}>
                  <XAxis dataKey="size" tick={{ fill: "var(--text3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text3)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: "rgba(74,158,255,0.08)" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {memberData.map((_, i) => (
                      <Cell key={i} fill={i === 1 ? "var(--blue)" : "var(--surface3)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent tables row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <CardHeader title={`🗺 ${tr.recentTrips}`} count={`${trips.length} ${tr.total}`} />
            <DataTable
              loading={loading}
              emptyIcon="🗺" emptyText="No trips yet"
              onRowClick={setSelectedTrip}
              columns={[
                { key: "name",    label: "Trip",     render: (v, row) => (
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--text)" }}>{v || "Untitled"}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{row.destination || "—"}</div>
                  </div>
                )},
                { key: "memberIds", label: tr.members, render: (v) => <Badge variant="blue">{1 + (v?.length || 0)}</Badge> },
                { key: "baseCurrency", label: "Currency", render: v => <Badge>{v || "—"}</Badge> },
              ]}
              rows={trips.slice(0, 8)}
            />
          </Card>

          <Card>
            <CardHeader title={`👤 ${tr.recentUsers}`} count={`${users.length} ${tr.total}`} />
            <DataTable
              loading={loading}
              emptyIcon="👤" emptyText="No users yet"
              onRowClick={setSelectedUser}
              columns={[
                { key: "displayName", label: "User", render: (v, row) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={v || row.username} size={30} />
                    <div>
                      <div style={{ fontWeight: 500, color: "var(--text)", fontSize: 13 }}>{v || row.username || "—"}</div>
                      <Mono dim>@{row.username || "—"}</Mono>
                    </div>
                  </div>
                )},
                { key: "email", label: "Email", render: v => <Mono dim>{v || "—"}</Mono> },
              ]}
              rows={users.slice(0, 8)}
            />
          </Card>
        </div>
      </div>

      <TripModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
