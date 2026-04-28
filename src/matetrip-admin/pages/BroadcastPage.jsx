import { useLang } from "../contexts/LangContext";
import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { Card, CardHeader, Btn, showToast } from "../components/ui";
import PageHeader from "../components/PageHeader";

// Push broadcast requires a backend with VAPID private key
const API_BASE = import.meta.env.VITE_MATETRIP_API_BASE_URL || "";

export default function BroadcastPage() {
  const { trips, push } = useData();
  const { tr } = useLang();
  const [title,  setTitle]  = useState("");
  const [body,   setBody]   = useState("");
  const [tripId, setTripId] = useState("");
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState(null);

  const targets = tripId
    ? push.filter(s => s.tripId === tripId || s.id.startsWith(tripId))
    : push;

  const handleSend = async () => {
    if (!body.trim()) { showToast(tr.enterMessage, "error"); return; }
    setSending(true);
    setResult(null);

    const tripIds = [...new Set(targets.map(s => s.tripId || s.id.split("_")[0]).filter(Boolean))];
    if (!tripIds.length && tripId) tripIds.push(tripId);

    let totalSent = 0;
    for (const tid of tripIds) {
      try {
        const res = await fetch(`${API_BASE}/api/push/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId: tid, senderUserId: "__admin__", senderName: title || "MateTrip", message: body }),
        });
        const data = await res.json();
        totalSent += data.sent || 0;
      } catch {}
    }

    setResult({ sent: totalSent, tripsCount: tripIds.length });
    showToast(`Sent to ${totalSent} device(s)`, "success");
    setSending(false);
  };

  return (
    <div>
      <PageHeader title={tr.broadcast} subtitle={tr.broadcastSub} />
      <div style={{ padding: 28, maxWidth: 560 }}>
        <Card>
          <CardHeader title={tr.sendNotif} />
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>
              Send a push notification to members across trips. Use for announcements, maintenance notices, or new features.
            </p>

            <FormField label={tr.notifTitle} hint={tr.defaultTitle}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="MateTrip"
                style={{ width: "100%", padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13, outline: "none" }} />
            </FormField>

            <FormField label={tr.message}>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder={tr.messagePlaceholder} rows={3}
                style={{ width: "100%", padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13, outline: "none", resize: "vertical" }} />
            </FormField>

            <FormField label={tr.targetTrip} hint={`${targets.length} ${tr.subscribers}`}>
              <select value={tripId} onChange={e => setTripId(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13, outline: "none" }}>
                <option value="">{tr.allTripsTarget} ({push.length})</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.name || "Untitled"} ({t.joinCode})</option>
                ))}
              </select>
            </FormField>

            <Btn variant="primary" onClick={handleSend} disabled={sending || !body.trim()}>
              {sending ? tr.sending : tr.sendBtn}
            </Btn>

            {result && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--green-pale)", borderRadius: 8, fontSize: 13, color: "var(--green)" }}>
                ✓ {tr.sentSuccess} {result.sent} {tr.devices} / {result.tripsCount} {tr.tripsCount}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", fontWeight: 600 }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "var(--text3)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
