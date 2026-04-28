import { useLang } from "../contexts/LangContext";
import { useState, useEffect } from "react";
import { Modal, ModalSection, DetailGrid, Badge, Btn, showToast } from "../components/ui";
import { getTripDetails, deleteTripCascade } from "../services/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useData } from "../contexts/DataContext";

export default function TripModal({ trip, onClose }) {
  const { users, removeTrip } = useData();
  const { tr } = useLang();
  const [details, setDetails] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [savingFeature, setSavingFeature] = useState(false);

  useEffect(() => {
    if (!trip) { setDetails(null); return; }
    getTripDetails(trip.id).then(setDetails);
  }, [trip?.id]);

  if (!trip) return null;

  const owner   = users.find(u => u.id === trip.createdBy);
  const members = (trip.memberIds || []).map(id => users.find(u => u.id === id)).filter(Boolean);
  const totalSpend = details?.receipts?.reduce((s, r) => s + (r.totalAmount || 0), 0) ?? 0;

  const handleDelete = async () => {
    if (!confirm(tr.confirmDeleteTrip.replace('{}', trip.name))) return;
    setDeleting(true);
    try {
      await deleteTripCascade(trip.id);
      removeTrip(trip.id);
      showToast(tr.tripDeleted, "success");
      onClose();
    } catch (e) {
      showToast(e.message, "error");
    }
    setDeleting(false);
  };

  const features = trip.features || {};

  const toggleFeature = async (key) => {
    setSavingFeature(key);
    try {
      const newVal = !features[key];
      await updateDoc(doc(db, "trips", trip.id), { [`features.${key}`]: newVal });
      // Optimistically update local trip object so UI reflects immediately
      trip.features = { ...features, [key]: newVal };
      showToast(`${key} ${newVal ? "已开启" : "已关闭"}`, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setSavingFeature(false);
  };

  const setPhotoMax = async (val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 1) return;
    setSavingFeature("photosMaxPerTrip");
    try {
      await updateDoc(doc(db, "trips", trip.id), { "features.photosMaxPerTrip": n });
      trip.features = { ...features, photosMaxPerTrip: n };
      showToast(`最多 ${n} 张`, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setSavingFeature(false);
  };

  const tripLimits = trip.limits || {};

  const setTripLimit = async (key, val) => {
    const n = val === "" || val === null ? null : parseInt(val);
    setSavingFeature(`limit_${key}`);
    try {
      await updateDoc(doc(db, "trips", trip.id), { [`limits.${key}`]: n });
      trip.limits = { ...tripLimits, [key]: n };
      showToast(`${key} → ${n ?? "无限制"}`, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setSavingFeature(false);
  };

  return (

    <Modal open={!!trip} onClose={onClose} title={`🗺 ${trip.name || "Untitled"}`} subtitle={`${trip.destination || ""} · ${trip.baseCurrency || ""}`}>
      <ModalSection title={tr.tripInfo}>
        <DetailGrid items={[
          { label: tr.tripIdLabel,  value: trip.id,            mono: true },
          { label: tr.joinCodeLabel, value: trip.joinCode,      color: "var(--accent)", mono: true },
          { label: tr.owner,     value: owner?.displayName || trip.createdBy },
          { label: tr.currency,  value: trip.baseCurrency },
          { label: tr.startDate, value: trip.startDate },
          { label: tr.endDate,   value: trip.endDate },
          { label: tr.totalMembers, value: 1 + (trip.memberIds?.length || 0) },
          { label: tr.totalSpend, value: details ? `${totalSpend.toLocaleString()} ${trip.baseCurrency || ""}` : "…", color: "var(--green)" },
        ]} />
      </ModalSection>

      {details ? (
        <ModalSection title={tr.activity}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              [tr.receipts, details.receipts.length,  "var(--green)"],
              [tr.schedule, details.schedule.length,  "var(--blue)"],
              [tr.messages, details.messages.length,  "var(--accent)"],
              [tr.photos,   details.photos.length,    "var(--yellow)"],
              [tr.people,   details.people.length,    "var(--text2)"],
            ].map(([label, count, color]) => (
              <div key={label} style={{ background: "var(--surface2)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color }}>{count}</div>
              </div>
            ))}
          </div>
        </ModalSection>
      ) : (
        <div style={{ textAlign: "center", padding: 24, color: "var(--text3)", fontSize: 13 }}>{tr.loadingDetails}</div>
      )}

      {members.length > 0 && (
        <ModalSection title={`${tr.membersSection} (${members.length})`}>
          {members.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--text2)" }}>
                {(m.displayName || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.displayName || "—"}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--font-mono)" }}>{m.email || ""}</div>
              </div>
            </div>
          ))}
        </ModalSection>
      )}

      {/* ── Feature Controls ── */}
      <ModalSection title={tr.lang === "zh" ? "功能控制" : "Feature Controls"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <FeatureRow
            icon="📷" label="OCR 识别账单"
            enabled={!!features.ocrEnabled}
            saving={savingFeature === "ocrEnabled"}
            onToggle={() => toggleFeature("ocrEnabled")}
          />
          <FeatureRow
            icon="🖼️" label="照片功能"
            enabled={!!features.photosEnabled}
            saving={savingFeature === "photosEnabled"}
            onToggle={() => toggleFeature("photosEnabled")}
          >
            {features.photosEnabled && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "var(--text3)" }}>最多张数：</span>
                {[5, 10, 20, 50, 100].map(n => (
                  <button key={n} onClick={() => setPhotoMax(n)}
                    disabled={savingFeature === "photosMaxPerTrip"}
                    style={{
                      padding: "3px 10px", borderRadius: 6, border: "1px solid",
                      borderColor: (features.photosMaxPerTrip || 5) === n ? "var(--accent)" : "var(--border)",
                      background: (features.photosMaxPerTrip || 5) === n ? "var(--accent)" : "var(--surface2)",
                      color: (features.photosMaxPerTrip || 5) === n ? "white" : "var(--text2)",
                      fontSize: 12, cursor: "pointer", fontWeight: (features.photosMaxPerTrip || 5) === n ? 700 : 400,
                    }}>{n}</button>
                ))}
                <input type="number" min="1" max="9999"
                  placeholder="自定义"
                  defaultValue={![5,10,20,50,100].includes(features.photosMaxPerTrip || 5) ? (features.photosMaxPerTrip || "") : ""}
                  onBlur={e => e.target.value && setPhotoMax(e.target.value)}
                  style={{ width: 60, padding: "3px 6px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 12, outline: "none" }}
                />
              </div>
            )}
          </FeatureRow>
          <FeatureRow
            icon="💬" label="留言"
            enabled={!!features.chatEnabled}
            saving={savingFeature === "chatEnabled"}
            onToggle={() => toggleFeature("chatEnabled")}
          />
        </div>
      </ModalSection>

      {/* ── Per-Trip Limit Overrides ── */}
      <ModalSection title="行程限制覆盖 (Admin Override)">
        <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>
          留空 = 使用会员等级默认值。填数字 = 强制覆盖（即使升级也生效）。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { key: "receiptLimit",  label: "账单上限 / Receipt limit" },
            { key: "scheduleLimit", label: "日程上限 / Schedule limit" },
            { key: "imageLimit",    label: "图片上限 / Image limit" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{label}</span>
              <input
                type="number" min="0"
                defaultValue={tripLimits[key] ?? ""}
                placeholder="默认"
                onBlur={e => setTripLimit(key, e.target.value || null)}
                disabled={savingFeature === `limit_${key}`}
                style={{ padding: "6px 8px", background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 6, color: "var(--text)", fontSize: 13, outline: "none", width: "100%" }}
              />
            </label>
          ))}
        </div>
      </ModalSection>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
        <Btn variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? "…" : tr.deleteTrip}</Btn>
        <Btn variant="ghost" onClick={onClose}>{tr.close}</Btn>
      </div>
    </Modal>
  );
}


// ── Feature Row ───────────────────────────────────────────────────────────────
function FeatureRow({ icon, label, enabled, saving, onToggle, children }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px", border: "1px solid", borderColor: enabled ? "var(--accent)" : "var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8,
          background: enabled ? "rgba(74,200,130,0.15)" : "var(--surface3)",
          color: enabled ? "#4ac882" : "var(--text3)" }}>
          {enabled ? "ON" : "OFF"}
        </span>
        <button onClick={onToggle} disabled={saving} style={{
          width: 42, height: 24, borderRadius: 12, border: "none",
          background: enabled ? "var(--accent)" : "var(--border2, #444)",
          position: "relative", cursor: saving ? "not-allowed" : "pointer",
          transition: "background 0.2s", opacity: saving ? 0.6 : 1, flexShrink: 0,
        }}>
          <span style={{
            position: "absolute", top: 2,
            left: enabled ? 20 : 2,
            width: 20, height: 20, borderRadius: "50%",
            background: "white", transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }} />
        </button>
      </div>
      {children}
    </div>
  );
}
