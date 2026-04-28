import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useLang } from "../contexts/LangContext";
import { Card, CardHeader, Spinner, showToast, Btn } from "../components/ui";
import PageHeader from "../components/PageHeader";

// Default config — matches what useAppConfig.js expects on the frontend
const DEFAULT_CONFIG = {
  ocrEnabled:       false,
  photosEnabled:    false,
  photosMaxPerTrip: 5,
  chatEnabled:      false,
};

const CONFIG_DOC = "appConfig/features";

export default function FeaturesPage() {
  const { lang } = useLang();
  const [config, setConfig]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const zh = lang === "zh";

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "appConfig", "features"));
      setConfig(snap.exists() ? { ...DEFAULT_CONFIG, ...snap.data() } : { ...DEFAULT_CONFIG });
    } catch (e) {
      showToast(e.message, "error");
      setConfig({ ...DEFAULT_CONFIG });
    }
    setLoading(false);
  };

  const save = async (newConfig) => {
    setSaving(true);
    try {
      await setDoc(doc(db, "appConfig", "features"), newConfig);
      setConfig(newConfig);
      showToast(zh ? "已保存 ✓" : "Saved ✓", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
    setSaving(false);
  };

  const toggle = (key) => {
    const updated = { ...config, [key]: !config[key] };
    save(updated);
  };

  const setNumber = (key, val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 1) return;
    const updated = { ...config, [key]: n };
    save(updated);
  };

  if (loading) return (
    <div>
      <PageHeader title={zh ? "功能控制" : "Features"} subtitle={zh ? "开启或关闭应用功能" : "Enable or disable app features"} />
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <Spinner size={24} />
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={zh ? "功能控制" : "Feature Controls"}
        subtitle={zh ? "开启功能后用户才可使用，关闭后立即生效" : "Changes take effect immediately for all users"}
      />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* OCR */}
        <FeatureCard
          icon="📷"
          title={zh ? "OCR 自动识别账单" : "OCR Receipt Scanning"}
          desc={zh ? "用户可以拍照上传收据，自动识别金额和商家名称" : "Users can upload receipt photos to auto-fill amount and merchant name"}
          enabled={config.ocrEnabled}
          onToggle={() => toggle("ocrEnabled")}
          saving={saving}
        />

        {/* Photos */}
        <FeatureCard
          icon="📷"
          title={zh ? "旅途照片功能" : "Trip Photos"}
          desc={zh ? "用户可以上传旅途照片和视频" : "Users can upload photos and videos to the trip gallery"}
          enabled={config.photosEnabled}
          onToggle={() => toggle("photosEnabled")}
          saving={saving}
        >
          {config.photosEnabled && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8 }}>
                {zh ? "每个旅程最多上传张数" : "Max photos per trip"}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {[5, 10, 20, 50, 100].map(n => (
                  <button key={n}
                    onClick={() => setNumber("photosMaxPerTrip", n)}
                    disabled={saving}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: config.photosMaxPerTrip === n ? "var(--accent)" : "var(--border)",
                      background: config.photosMaxPerTrip === n ? "var(--accent)" : "var(--surface2)",
                      color: config.photosMaxPerTrip === n ? "white" : "var(--text2)",
                      fontSize: 13,
                      fontWeight: config.photosMaxPerTrip === n ? 700 : 400,
                      cursor: saving ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}>
                    {n}
                  </button>
                ))}
                <span style={{ fontSize: 12, color: "var(--text3)", marginLeft: 4 }}>
                  {zh ? "张" : "photos"}
                </span>
                {/* Custom number input */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                  <input
                    type="number" min="1" max="9999"
                    value={![5,10,20,50,100].includes(config.photosMaxPerTrip) ? config.photosMaxPerTrip : ""}
                    placeholder={zh ? "自定义" : "Custom"}
                    onChange={e => setNumber("photosMaxPerTrip", e.target.value)}
                    style={{
                      width: 72, padding: "6px 8px",
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      borderRadius: 8, color: "var(--text)", fontSize: 12, outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </FeatureCard>

        {/* Chat */}
        <FeatureCard
          icon="💬"
          title={zh ? "旅途留言" : "Trip Chat"}
          desc={zh ? "用户可以在旅程内发送留言互动" : "Users can send messages within a trip"}
          enabled={config.chatEnabled}
          onToggle={() => toggle("chatEnabled")}
          saving={saving}
        />

        {/* Info box */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "14px 16px",
          fontSize: 12, color: "var(--text3)", lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>
            ℹ️ {zh ? "说明" : "How it works"}
          </div>
          {zh
            ? "这里的开关会立即写入 Firestore appConfig/features 文档。前端每次启动时读取，关闭的功能对用户完全隐藏。"
            : "Toggles write to Firestore appConfig/features instantly. The frontend reads this on startup — disabled features are fully hidden from users."}
        </div>

      </div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, enabled, onToggle, saving, children }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid",
      borderColor: enabled ? "var(--accent)" : "var(--border)",
      borderRadius: 12, padding: "18px 20px",
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: enabled ? "rgba(255,107,74,0.12)" : "var(--surface2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, transition: "background 0.2s",
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{title}</div>
            <StatusPill enabled={enabled} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>{desc}</div>
        </div>
        <Toggle enabled={enabled} onToggle={onToggle} saving={saving} />
      </div>
      {children}
    </div>
  );
}

function StatusPill({ enabled }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
      background: enabled ? "rgba(74,200,130,0.15)" : "var(--surface2)",
      color: enabled ? "#4ac882" : "var(--text3)",
      letterSpacing: 0.3,
    }}>
      {enabled ? "ON" : "OFF"}
    </span>
  );
}

function Toggle({ enabled, onToggle, saving }) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      style={{
        width: 48, height: 26, borderRadius: 13, border: "none",
        background: enabled ? "var(--accent)" : "var(--border2, #444)",
        position: "relative", cursor: saving ? "not-allowed" : "pointer",
        transition: "background 0.2s", flexShrink: 0,
        opacity: saving ? 0.6 : 1,
      }}>
      <span style={{
        position: "absolute", top: 3,
        left: enabled ? 25 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "white",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}
