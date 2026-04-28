import { useState } from "react";
import { deleteDoc, doc, updateDoc, setDoc, arrayRemove, getDocs, collection } from "firebase/firestore";
import { db } from "../services/firebase";
import { Modal, ModalSection, DetailGrid, Badge, Btn, showToast } from "../components/ui";
import { useData } from "../contexts/DataContext";
import { useLang } from "../contexts/LangContext";

// Level defaults — keep in sync with MemberContext.jsx
const LEVEL_DEFAULTS = {
  guest:  { tripLimit: 1,  receiptLimit: 0,   imageLimit: 0,   scheduleLimit: 0,   chat: false, report: false },
  member: { tripLimit: 2,  receiptLimit: 20,  imageLimit: 5,   scheduleLimit: 5,   chat: false, report: false },
  vip:    { tripLimit: 10, receiptLimit: null, imageLimit: 50,  scheduleLimit: null, chat: false, report: true  },
  vvip:   { tripLimit: 50, receiptLimit: null, imageLimit: 150, scheduleLimit: null, chat: true,  report: true  },
};

// Convert a limits object to controlled input state (null → "")
function limitsToState(limits) {
  return {
    tripLimit:     limits?.tripLimit     != null ? String(limits.tripLimit)     : "",
    receiptLimit:  limits?.receiptLimit  != null ? String(limits.receiptLimit)  : "",
    imageLimit:    limits?.imageLimit    != null ? String(limits.imageLimit)    : "",
    scheduleLimit: limits?.scheduleLimit != null ? String(limits.scheduleLimit) : "",
    chat:          limits?.chat   ?? false,
    report:        limits?.report ?? false,
  };
}

// Returns YYYY-MM-DD for one month from today (same day next month)
function nextMonthSameDay() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

// Convert controlled state back to Firestore customLimits object
function stateToLimits(state) {
  return {
    tripLimit:     state.tripLimit     !== "" ? parseInt(state.tripLimit)     : null,
    receiptLimit:  state.receiptLimit  !== "" ? parseInt(state.receiptLimit)  : null,
    imageLimit:    state.imageLimit    !== "" ? parseInt(state.imageLimit)    : null,
    scheduleLimit: state.scheduleLimit !== "" ? parseInt(state.scheduleLimit) : null,
    chat:   state.chat,
    report: state.report,
  };
}

// Firebase-only user deletion (removes Firestore data; Auth account requires Cloud Functions)
async function deleteUserFirestore(uid) {
  // Remove from usernames collection
  await deleteDoc(doc(db, "usernames", uid)).catch(() => {});

  // Remove from all trips' memberIds
  const tripsSnap = await getDocs(collection(db, "trips"));
  const promises = tripsSnap.docs
    .filter(d => (d.data().memberIds || []).includes(uid) || d.data().createdBy === uid)
    .map(d => updateDoc(d.ref, { memberIds: arrayRemove(uid) }));
  await Promise.all(promises);
}

export default function UserModal({ user, onClose }) {
  const { trips, reload }   = useData();
  const { tr, lang }        = useLang();
  const [showPwForm, setShowPwForm]     = useState(false);
  const [newPassword, setNewPassword]   = useState("");
  const [pwLoading, setPwLoading]       = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [savingLevel, setSavingLevel]   = useState(false);
  const [localLevel, setLocalLevel]     = useState(user?.memberLevel || "member");
  const [limitState, setLimitState]     = useState(limitsToState(user?.customLimits));
  const [savingLimit, setSavingLimit]   = useState(false);
  const [subExpiry, setSubExpiry]       = useState(user?.subscriptionExpiry || nextMonthSameDay());
  const [savingExpiry, setSavingExpiry] = useState(false);

  if (!user) return null;

  const LEVELS = ["guest","member","vip","vvip"];
  const LEVEL_COLORS = { guest:"#888", member:"#4a90d9", vip:"#e8a020", vvip:"#c040e8" };

  const uid = user.uid || user.id;
  const userTrips = trips.filter(t => t.createdBy === uid || (t.memberIds || []).includes(uid));

  const handleDelete = async () => {
    const msg = lang === "zh"
      ? `确定删除用户「${user.displayName || user.username}」的 Firestore 数据？\n注意：Auth 账号需通过 Firebase Cloud Functions 删除。`
      : `Remove user "${user.displayName || user.username}" from Firestore?\nNote: Deleting the Auth account requires Firebase Cloud Functions.`;
    if (!confirm(msg)) return;
    setDeleting(true);
    try {
      await deleteUserFirestore(uid);
      showToast(lang === "zh" ? "Firestore 数据已删除 ✓" : "Firestore data removed ✓", "success");
      onClose();
      setTimeout(reload, 500);
    } catch (err) { showToast(err.message, "error"); }
    setDeleting(false);
  };

  const handleChangePassword = async () => {
    showToast(
      lang === "zh"
        ? "改密功能需要 Firebase Cloud Functions"
        : "Password change requires Firebase Cloud Functions",
      "error"
    );
  };

  return (
    <Modal open={!!user} onClose={onClose}
      title={`👤 ${user.displayName || user.username || "User"}`}
      subtitle={`@${user.username || "—"} · ${user.email || "—"}`}>

      <ModalSection title={tr.accountInfo}>
        <DetailGrid items={[
          { label: tr.uid,         value: uid,              mono: true },
          { label: tr.username,    value: `@${user.username || "—"}` },
          { label: tr.displayName, value: user.displayName },
          { label: tr.email,       value: user.email,       mono: true },
          { label: tr.tripsLabel,  value: userTrips.length, color: "var(--blue)" },
          { label: tr.owned,       value: trips.filter(t => t.createdBy === uid).length, color: "var(--accent)" },
        ]} />
      </ModalSection>

      {userTrips.length > 0 && (
        <ModalSection title={`${tr.trips} (${userTrips.length})`}>
          {userTrips.map(t => (
            <div key={t.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize:13,fontWeight:500 }}>{t.name || "Untitled"}</div>
                <div style={{ fontSize:11,color:"var(--text3)" }}>{t.destination || ""} {t.baseCurrency ? `· ${t.baseCurrency}` : ""}</div>
              </div>
              <Badge variant={t.createdBy === uid ? "accent" : "blue"}>
                {t.createdBy === uid ? tr.owner : tr.members}
              </Badge>
            </div>
          ))}
        </ModalSection>
      )}

      {/* Member Level */}
      <ModalSection title={lang === "zh" ? "🏅 会员等级" : "🏅 Member Level"}>
        {/* Level selector — clicking auto-fills limits with level defaults */}
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
          {LEVELS.map(lvl => (
            <button key={lvl} onClick={async () => {
              setSavingLevel(true);
              // Auto-fill limits with this level's defaults
              const defaults = LEVEL_DEFAULTS[lvl];
              const autoState = limitsToState(defaults);
              const autoLimits = stateToLimits(autoState);
              // Auto-set expiry to next month for paid levels
              const newExpiry = (lvl === "vip" || lvl === "vvip") ? nextMonthSameDay() : "";
              try {
                await setDoc(doc(db, "usernames", uid), {
                  memberLevel: lvl,
                  customLimits: autoLimits,
                  subscriptionExpiry: newExpiry || null,
                }, { merge: true });
                setLocalLevel(lvl);
                setLimitState(autoState);
                if (newExpiry) setSubExpiry(newExpiry);
                showToast(`Level → ${lvl.toUpperCase()}`, "success");
              } catch(e) { showToast(e.message, "error"); }
              setSavingLevel(false);
            }} disabled={savingLevel} style={{
              padding:"5px 14px", borderRadius:8, border:"2px solid",
              borderColor: localLevel===lvl ? LEVEL_COLORS[lvl] : "var(--border)",
              background: localLevel===lvl ? LEVEL_COLORS[lvl]+"22" : "var(--surface2)",
              color: localLevel===lvl ? LEVEL_COLORS[lvl] : "var(--text3)",
              fontWeight: localLevel===lvl ? 700 : 400, fontSize:13, cursor:"pointer",
            }}>{lvl.toUpperCase()}</button>
          ))}
        </div>

        {/* Subscription expiry date */}
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
          <label style={{ fontSize:11,color:"var(--text3)",flexShrink:0 }}>
            {lang==="zh" ? "订阅到期日" : "Subscription expiry"}
          </label>
          <input type="date" value={subExpiry}
            onChange={e => setSubExpiry(e.target.value)}
            style={{ flex:1,padding:"6px 8px",background:"var(--surface2)",border:"1px solid var(--border)",
              borderRadius:6,color:"var(--text)",fontSize:13,outline:"none" }}
          />
          <Btn variant="ghost" disabled={savingExpiry} onClick={async () => {
            setSavingExpiry(true);
            try {
              await setDoc(doc(db, "usernames", uid), { subscriptionExpiry: subExpiry || null }, { merge: true });
              showToast(lang==="zh" ? `到期日已更新` : `Expiry updated`, "success");
            } catch(e) { showToast(e.message, "error"); }
            setSavingExpiry(false);
          }}>
            {savingExpiry ? "…" : (lang==="zh" ? "保存" : "Save")}
          </Btn>
        </div>

        {/* Custom limit overrides */}
        <p style={{ fontSize:11,color:"var(--text3)",marginBottom:8 }}>
          {lang==="zh" ? "自定义限制（切换等级时自动填入）" : "Custom limits (auto-filled when changing level)"}
        </p>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
          {[
            { key:"tripLimit",     label: lang==="zh"?"行程上限":"Trip limit",     placeholder:"∞" },
            { key:"receiptLimit",  label: lang==="zh"?"账单上限":"Receipt limit",  placeholder:"∞" },
            { key:"imageLimit",    label: lang==="zh"?"图片上限":"Image limit",    placeholder:"∞" },
            { key:"scheduleLimit", label: lang==="zh"?"日程上限":"Schedule limit", placeholder:"∞" },
          ].map(({ key, label, placeholder }) => (
            <label key={key} style={{ display:"flex",flexDirection:"column",gap:3 }}>
              <span style={{ fontSize:11,color:"var(--text3)" }}>{label}</span>
              <input type="number" min="0"
                value={limitState[key]}
                placeholder={placeholder}
                onChange={e => setLimitState(s => ({ ...s, [key]: e.target.value }))}
                disabled={savingLimit}
                style={{ padding:"6px 8px",background:"var(--surface2)",border:"1px solid var(--border)",
                  borderRadius:6,color:"var(--text)",fontSize:13,outline:"none" }}
              />
            </label>
          ))}
        </div>

        {/* Report & Chat toggles */}
        <div style={{ display:"flex",gap:12,marginBottom:12 }}>
          {[
            { key:"report", label: lang==="zh"?"旅行报告":"Travel Report" },
            { key:"chat",   label: lang==="zh"?"聊天功能":"Chat" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",
              background:"var(--surface2)",borderRadius:8,padding:"7px 12px",flex:1 }}>
              <input type="checkbox"
                checked={!!limitState[key]}
                onChange={e => setLimitState(s => ({ ...s, [key]: e.target.checked }))}
                style={{ width:16,height:16,accentColor:"var(--accent)",cursor:"pointer" }}
              />
              <span style={{ fontSize:13,color:"var(--text)",userSelect:"none" }}>{label}</span>
            </label>
          ))}
        </div>

        {/* Save limits button */}
        <Btn variant="primary" disabled={savingLimit} onClick={async () => {
          setSavingLimit(true);
          try {
            const limits = stateToLimits(limitState);
            // Remove null entries so they don't override level defaults unnecessarily
            Object.keys(limits).forEach(k => { if (limits[k] === null && typeof limits[k] !== "boolean") delete limits[k]; });
            await setDoc(doc(db, "usernames", uid), { customLimits: limits }, { merge: true });
            showToast(lang==="zh" ? "限制已保存 ✓" : "Limits saved ✓", "success");
          } catch(e) { showToast(e.message, "error"); }
          setSavingLimit(false);
        }}>
          {savingLimit ? "…" : (lang==="zh" ? "💾 保存限制" : "💾 Save Limits")}
        </Btn>
      </ModalSection>

      {/* Change Password */}
      <ModalSection title={lang === "zh" ? "🔑 修改密码" : "🔑 Change Password"}>
        {!showPwForm ? (
          <Btn variant="ghost" onClick={() => setShowPwForm(true)}>
            {lang === "zh" ? "修改该用户密码…" : "Change password…"}
          </Btn>
        ) : (
          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
            <input
              type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleChangePassword()}
              placeholder={lang === "zh" ? "新密码（至少 6 位）" : "New password (min 6 chars)"}
              style={{ flex:1,minWidth:180,padding:"9px 12px",background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:6,color:"var(--text)",fontSize:13,outline:"none" }}
              autoFocus
            />
            <Btn variant="primary" onClick={handleChangePassword} disabled={pwLoading}>
              {pwLoading ? "…" : (lang === "zh" ? "确认" : "Confirm")}
            </Btn>
            <Btn variant="ghost" onClick={() => { setShowPwForm(false); setNewPassword(""); }}>
              {tr.close}
            </Btn>
          </div>
        )}
      </ModalSection>

      {/* Danger Zone */}
      <div style={{ borderTop:"1px solid var(--border)",paddingTop:16,marginTop:4,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:12,fontWeight:600,color:"var(--red)",marginBottom:2 }}>
            {lang === "zh" ? "危险操作" : "Danger Zone"}
          </div>
          <div style={{ fontSize:11,color:"var(--text3)" }}>
            {lang === "zh" ? "删除后无法恢复，用户将无法登录" : "Cannot be undone — user will lose access"}
          </div>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <Btn variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "…" : (lang === "zh" ? "🗑 删除用户" : "🗑 Delete User")}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>{tr.close}</Btn>
        </div>
      </div>
    </Modal>
  );
}
