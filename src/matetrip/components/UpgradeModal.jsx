import { useMember, UPGRADE_PLANS, MEMBER_LEVELS } from "../contexts/MemberContext";
import { useLang } from "../contexts/LangContext";
import "./UpgradeModal.css";

export default function UpgradeModal() {
  const { upgradeOpen, setUpgradeOpen, upgradeReason, memberLevel, isGuest } = useMember();
  const { lang, tr } = useLang();
  const zh = lang === "zh";
  const ms = lang === "ms";

  if (!upgradeOpen) return null;

  // Guests see a register prompt instead of pricing
  if (isGuest) {
    return (
      <div className="upgrade-overlay" onClick={() => setUpgradeOpen(false)}>
        <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
          <button className="upgrade-close" onClick={() => setUpgradeOpen(false)}>✕</button>
          <div className="upgrade-header">
            <div className="upgrade-icon">👤</div>
            <h2 className="upgrade-title">
              {zh ? "注册账号" : ms ? "Daftar Akaun" : "Create an Account"}
            </h2>
            {upgradeReason && <p className="upgrade-reason">{upgradeReason}</p>}
            <p className="upgrade-reason" style={{ marginTop: 8 }}>
              {zh
                ? "您目前以游客身份浏览，注册免费账号即可创建行程、添加账单等。"
                : ms
                  ? "Anda sedang melayari sebagai tetamu. Daftar akaun percuma untuk cipta perjalanan, tambah resit dan lebih banyak lagi."
                  : "You're browsing as a guest. Register a free account to create trips, add receipts, and more."}
            </p>
          </div>
          <div style={{ padding: "0 4px 8px" }}>
            <a
              href="/matetrip"
              className="upgrade-plan-btn"
              style={{ background: "var(--terracotta)", display: "block", textAlign: "center",
                textDecoration: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, color: "white" }}
              onClick={() => setUpgradeOpen(false)}
            >
              {zh ? "🔑 登录 / 注册" : ms ? "🔑 Log Masuk / Daftar" : "🔑 Sign In / Register"}
            </a>
          </div>
          <p className="upgrade-note">
            {zh ? "注册完全免费，无需信用卡。" : ms ? "Pendaftaran percuma, tiada kad kredit diperlukan." : "Registration is completely free — no credit card needed."}
          </p>
        </div>
      </div>
    );
  }

  // VVIP — already at top level, show contact card
  if (memberLevel === "vvip") {
    return (
      <div className="upgrade-overlay" onClick={() => setUpgradeOpen(false)}>
        <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
          <button className="upgrade-close" onClick={() => setUpgradeOpen(false)}>✕</button>
          <div className="upgrade-header">
            <div className="upgrade-icon">👑</div>
            <h2 className="upgrade-title" style={{ color: MEMBER_LEVELS.vvip.color }}>
              {tr.alreadyTopLevel}
            </h2>
            <p className="upgrade-reason" style={{ marginTop: 8 }}>
              {zh
                ? "您是 VVIP 会员，已享有全部功能。如有任何需求，欢迎联系客服。"
                : ms
                  ? "Anda adalah ahli VVIP dan menikmati semua ciri. Hubungi kami jika ada keperluan."
                  : "You're a VVIP member with access to all features. Feel free to reach out if you need anything."}
            </p>
          </div>
          <div style={{ padding: "0 4px 8px" }}>
            <a
              href="https://wa.me/60126947823?text=Hi%2C+I%27m+a+MateTrip+VVIP+member+and+need+assistance"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#25D366", display: "block", textAlign: "center",
                textDecoration: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, color: "white" }}
            >
              💬 {tr.contactSupport} (WhatsApp)
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Filter plans: VIP users only see VVIP upgrade option
  const visiblePlans = memberLevel === "vip"
    ? UPGRADE_PLANS.filter(p => p.level === "vvip")
    : UPGRADE_PLANS;

  return (
    <div className="upgrade-overlay" onClick={() => setUpgradeOpen(false)}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <button className="upgrade-close" onClick={() => setUpgradeOpen(false)}>✕</button>
        <div className="upgrade-header">
          <div className="upgrade-icon">🚀</div>
          <h2 className="upgrade-title">{zh ? "升级会员" : "Upgrade Plan"}</h2>
          {upgradeReason && (
            <p className="upgrade-reason">{upgradeReason}</p>
          )}
          <div className="upgrade-current">
            {zh ? "当前等级：" : "Current plan: "}
            <span style={{ color: MEMBER_LEVELS[memberLevel]?.color, fontWeight: 700 }}>
              {zh ? MEMBER_LEVELS[memberLevel]?.labelZh : MEMBER_LEVELS[memberLevel]?.label}
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="upgrade-plans">
          {visiblePlans.map(plan => (
            <div key={plan.level} className="upgrade-plan" style={{ "--plan-color": plan.color }}>
              <div className="upgrade-plan-header">
                <span className="upgrade-plan-label" style={{ color: plan.color }}>{plan.label}</span>
                <span className="upgrade-plan-price">{plan.price} / {tr.perMonth}</span>
              </div>
              <ul className="upgrade-plan-features">
                {(zh ? plan.featuresZh : plan.features).map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
              <a
                href={`https://wa.me/60126947823?text=Hi%2C+I+want+to+upgrade+to+MateTrip+${plan.label}`}
                target="_blank"
                rel="noopener noreferrer"
                className="upgrade-plan-btn"
                style={{ background: plan.color }}
              >
                {zh ? `升级 ${plan.label}` : `Upgrade to ${plan.label}`}
              </a>
            </div>
          ))}
        </div>

        <p className="upgrade-note">
          {zh
            ? "请联系我们完成升级，升级后由管理员手动激活。"
            : "Contact us to complete your upgrade. Admin will activate your plan."}
        </p>
      </div>
    </div>
  );
}
