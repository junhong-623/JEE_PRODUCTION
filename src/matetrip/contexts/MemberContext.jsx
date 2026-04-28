import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "./AuthContext";

// ── Level definitions ─────────────────────────────────────────────────────────
export const MEMBER_LEVELS = {
  guest:  { tripLimit: 1,  receiptLimit: 0,    imageLimit: 0,   scheduleLimit: 0,   chat: false, report: false, readOnly: true,  label: "Guest",  labelZh: "游客",  color: "#888" },
  member: { tripLimit: 2,  receiptLimit: 20,   imageLimit: 5,   scheduleLimit: 5,   chat: false, report: false, readOnly: false, label: "Member", labelZh: "普通",  color: "#4a90d9" },
  vip:    { tripLimit: 10, receiptLimit: null,  imageLimit: 50,  scheduleLimit: null, chat: false, report: true,  readOnly: false, label: "VIP",    labelZh: "VIP",   color: "#e8a020" },
  vvip:   { tripLimit: 50, receiptLimit: null,  imageLimit: 150, scheduleLimit: null, chat: true,  report: true,  readOnly: false, label: "VVIP",   labelZh: "VVIP",  color: "#c040e8" },
};

export const UPGRADE_PLANS = [
  {
    level: "vip",
    label: "VIP",
    color: "#e8a020",
    price: "RM 15",
    features: [
      "Up to 10 trips",
      "Unlimited receipts & schedule",
      "50 photos per trip",
      "Travel Report enabled",
    ],
    featuresZh: [
      "最多 10 个行程",
      "无限账单与日程",
      "每趟旅程最多 50 张图片",
      "解锁旅行报告",
    ],
  },
  {
    level: "vvip",
    label: "VVIP",
    color: "#c040e8",
    price: "RM 25",
    features: [
      "Up to 50 trips",
      "Unlimited receipts & schedule",
      "150 photos per trip",
      "Travel Report + Chat enabled",
    ],
    featuresZh: [
      "最多 50 个行程",
      "无限账单与日程",
      "每趟旅程最多 150 张图片",
      "解锁旅行报告 + 留言",
    ],
  },
];

const MemberContext = createContext(null);

export function MemberProvider({ children }) {
  const { user } = useAuth();
  const [memberLevel, setMemberLevel] = useState("member");
  const [customLimits, setCustomLimits] = useState({}); // admin overrides per user
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  // Load member level from Firestore
  useEffect(() => {
    if (!user) { setMemberLevel("member"); setCustomLimits({}); return; }
    if (user.isAnonymous) { setMemberLevel("guest"); setCustomLimits({}); return; }

    getDoc(doc(db, "usernames", user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        let level = data.memberLevel || "member";
        // Downgrade if subscription expired
        if (level !== "member" && level !== "guest" && data.subscriptionExpiry) {
          const expiry = new Date(data.subscriptionExpiry);
          expiry.setHours(23, 59, 59, 999); // end of expiry day
          if (expiry < new Date()) level = "member";
        }
        setMemberLevel(level);
        setCustomLimits(data.customLimits || {});
      }
    }).catch(() => {});
  }, [user?.uid]);

  // Resolved limits: customLimits override level defaults
  const getLimits = useCallback((tripLimitsOverride = {}) => {
    const base = MEMBER_LEVELS[memberLevel] || MEMBER_LEVELS.member;
    return {
      tripLimit:     tripLimitsOverride.tripLimit     ?? customLimits.tripLimit     ?? base.tripLimit,
      receiptLimit:  tripLimitsOverride.receiptLimit  ?? customLimits.receiptLimit  ?? base.receiptLimit,
      imageLimit:    tripLimitsOverride.imageLimit    ?? customLimits.imageLimit    ?? base.imageLimit,
      scheduleLimit: tripLimitsOverride.scheduleLimit ?? customLimits.scheduleLimit ?? base.scheduleLimit,
      chat:          customLimits.chat               ?? base.chat,
      report:        customLimits.report             ?? base.report,
      readOnly:      base.readOnly,
    };
  }, [memberLevel, customLimits]);

  const showUpgrade = useCallback((reason = "") => {
    setUpgradeReason(reason);
    setUpgradeOpen(true);
  }, []);

  const isGuest   = memberLevel === "guest";
  const isReadOnly = MEMBER_LEVELS[memberLevel]?.readOnly ?? false;

  return (
    <MemberContext.Provider value={{
      memberLevel, setMemberLevel, customLimits,
      getLimits, isGuest, isReadOnly,
      upgradeOpen, setUpgradeOpen,
      upgradeReason, showUpgrade,
    }}>
      {children}
    </MemberContext.Provider>
  );
}

export const useMember = () => useContext(MemberContext);
