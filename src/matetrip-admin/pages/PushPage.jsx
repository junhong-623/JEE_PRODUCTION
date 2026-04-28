import { useLang } from "../contexts/LangContext";
import { useData } from "../contexts/DataContext";
import { Card, CardHeader, DataTable, Btn, Mono, showToast } from "../components/ui";
import PageHeader from "../components/PageHeader";
import { deletePushSubscription } from "../services/firestore";

export default function PushPage() {
  const { push, trips, users, loading, removePush } = useData();
  const { tr } = useLang();

  const handleDelete = async (sub) => {
    if (!confirm(tr.confirmRemovePush)) return;
    await deletePushSubscription(sub.id);
    removePush(sub.id);
    showToast(tr.pushRemoved, "success");
  };

  const enriched = push.map(s => {
    const [tripId, userId] = s.id.split("_");
    const trip = trips.find(t => t.id === s.tripId || t.id === tripId);
    const user = users.find(u => u.id === s.userId || u.id === userId);
    return { ...s, _tripName: trip?.name, _userName: user?.displayName || user?.username };
  });

  const columns = [
    { key: "id",       label: tr.docId,  render: v => <Mono dim>{v}</Mono> },
    { key: "_tripName",label: tr.trips,         render: v => <span style={{ color: "var(--text)" }}>{v || "—"}</span> },
    { key: "_userName",label: tr.user,         render: v => <span style={{ color: "var(--text)" }}>{v || "—"}</span> },
    { key: "updatedAt",label: tr.updated,      render: v => <Mono dim>{v ? new Date(v.seconds * 1000).toLocaleDateString() : "—"}</Mono> },
    { key: "_action",  label: "",             render: (_, row) => (
      <Btn variant="danger" size="sm" onClick={e => { e.stopPropagation(); handleDelete(row); }}>{tr.remove}</Btn>
    )},
  ];

  return (
    <div>
      <PageHeader title={tr.pushSubs} subtitle={`${push.length} ${tr.activeDevices}`} />
      <div style={{ padding: 28 }}>
        <Card>
          <CardHeader title={tr.allPushSubs} count={`${push.length}`} />
          <DataTable loading={loading} columns={columns} rows={enriched} emptyIcon="🔔" emptyText={tr.noPush} />
        </Card>
      </div>
    </div>
  );
}
