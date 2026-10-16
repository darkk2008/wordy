/* components/premium-settings/premium-settings.jsx
 * Premium plans/features and the Premium settings screen.
 */

import { Fragment, useEffect, useRef, useState } from "react";
import { recordPremiumIntent } from "../../services/analytics-presence";
import {
  loadActiveDiscount,
  loadPremiumStatus,
  redeemPromoCode,
} from "../../services/premium-gems-store";
import { IconBtn } from "../common/common";
import { Input } from "../common/Input";
import { openTelegramPurchase } from "../contacts-settings/contacts-settings";
import { Check, ChevronLeft } from "../icons/icons";
import { CrownIcon, GemIcon, TagIcon } from "../icons/settings-icons";
import { celebratePremiumUnlock } from "../premium-celebration/premium-celebration";
import { PROMO_TYPE_LABELS, formatAdminDate } from "../stack-card/stack-card";
import { GEM_PACKS } from "../store/store";

const PREMIUM_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$4",
    period: "/ month",
    sub: "Billed every month",
    badge: null,
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$13",
    period: "/ year",
    sub: "Just $1.08/mo — save 73%",
    badge: "Best value",
  },
  {
    id: "lifetime",
    name: "Forever",
    price: "$26",
    period: "one-time",
    sub: "Pay once, yours forever",
    badge: "Pay once",
  },
];
const PREMIUM_FEATURES = [
  "Unlimited AI Tutor chats, auto-fill & translations",
  "Deeper stats: mastery trends & streak insights",
  "Unlimited stacks, families & mini-stacks",
  "Every app theme, unlocked",
  "Priority cloud backup & sync",
  "Early access to new games and features",
];
export function PremiumSettings({ onBack, gemsBalance, onAddGems }) {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [selectedGemPack, setSelectedGemPack] = useState("pack_medium");
  const [promoCode, setPromoCode] = useState("");
  const [notice, setNotice] = useState("");
  const [premiumStatus, setPremiumStatus] = useState(() => loadPremiumStatus());
  const [activeDiscount, setActiveDiscount] = useState(() => loadActiveDiscount());
  const [showRedeemMore, setShowRedeemMore] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const noticeTimer = useRef(null);
  const showNotice = (msg) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2800);
  };
  useEffect(
    () => () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    },
    []
  );
  const applyPromoCode = async () => {
    if (redeeming) return;
    setRedeeming(true);
    const wasActive = premiumStatus.active;
    const result = await redeemPromoCode(promoCode);
    setRedeeming(false);
    showNotice(result.message);
    if (result.ok) {
      setPromoCode("");
      if (result.status) {
        setPremiumStatus(result.status);
        if (!wasActive && result.status.active) {
          celebratePremiumUnlock(result.status.type);
        }
      }
      if (result.discount) {
        setActiveDiscount(result.discount);
      }
      if (result.gemsAmount) {
        onAddGems && onAddGems(result.gemsAmount);
      }
    }
  };
  const discountPercent = activeDiscount ? activeDiscount.percent : 0;
  const applyDiscount = (priceStr) => {
    if (!discountPercent) return null;
    const match = /([\d.]+)/.exec(priceStr);
    if (!match) return null;
    const amount = parseFloat(match[1]);
    if (isNaN(amount)) return null;
    const discounted = amount * (1 - discountPercent / 100);
    return priceStr.replace(
      match[1],
      discounted % 1 === 0 ? String(discounted) : discounted.toFixed(2)
    );
  };
  const plan = PREMIUM_PLANS.find((p) => p.id === selectedPlan) || PREMIUM_PLANS[0];
  const gemPack = GEM_PACKS.find((p) => p.id === selectedGemPack) || GEM_PACKS[0];
  const isActive = premiumStatus.active;
  const planLabel = PROMO_TYPE_LABELS[premiumStatus.type] || premiumStatus.type;
  const promoSection = (
    <>
      <div className="dm-settings-section-label">Promo code</div>
      <div className="dm-premium-promo-row">
        <div className="dm-premium-promo-input-wrap">
          <TagIcon size={15} className="dm-premium-promo-icon" />
          <Input
            className="dm-input dm-premium-promo-input"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            autoCapitalize="characters"
            onKeyDown={(e) => {
              if (e.key === "Enter" && promoCode.trim() && !redeeming) applyPromoCode();
            }}
          />
        </div>
        <button
          type="button"
          className="dm-btn-secondary dm-premium-promo-btn"
          disabled={!promoCode.trim() || redeeming}
          onClick={applyPromoCode}
        >
          {redeeming ? "Checking…" : "Apply"}
        </button>
      </div>
    </>
  );
  return (
    <div className="dm-view dm-settings-subview dm-premium-view">
      <div className="dm-topbar">
        <IconBtn onClick={onBack}>
          <ChevronLeft size={20} />
        </IconBtn>
        <div className="dm-topbar-title">Premium</div>
      </div>
      <div className="dm-premium-hero">
        <div className={`dm-premium-hero-icon ${isActive ? "dm-premium-hero-icon-active" : ""}`}>
          {isActive ? <Check size={28} /> : <CrownIcon size={30} />}
        </div>
        <h2 className="dm-premium-hero-title">{isActive ? "You're Premium" : "wwordy Premium"}</h2>
        <p className="dm-premium-hero-sub">
          {isActive
            ? "Thanks for supporting wwordy — everything below is unlocked."
            : "Unlock the full toolkit for learning faster and remembering more."}
        </p>
        {isActive && (
          <div className="dm-premium-active-badge">
            <Check size={13} />
            {` ${planLabel}${premiumStatus.expiresAt ? ` · renews ${formatAdminDate(premiumStatus.expiresAt)}` : " · lifetime access"}`}
          </div>
        )}
      </div>
      {isActive && (
        <div className="dm-premium-manage-card">
          <div className="dm-premium-manage-row">
            <span className="dm-premium-manage-label">Plan</span>
            <span className="dm-premium-manage-value">{planLabel}</span>
          </div>
          <div className="dm-premium-manage-divider" />
          <div className="dm-premium-manage-row">
            <span className="dm-premium-manage-label">
              {premiumStatus.expiresAt ? "Renews / expires" : "Access"}
            </span>
            <span className="dm-premium-manage-value">
              {premiumStatus.expiresAt
                ? formatAdminDate(premiumStatus.expiresAt)
                : "Lifetime — never expires"}
            </span>
          </div>
        </div>
      )}
      <div className="dm-settings-section-label">
        {isActive ? "What’s included" : "Included with Premium"}
      </div>
      <div className="dm-premium-features">
        {PREMIUM_FEATURES.map((f, i) => (
          <div key={i} className="dm-premium-feature">
            <span className="dm-premium-feature-check">
              <Check size={13} />
            </span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      {!isActive && <div className="dm-settings-section-label">Choose a plan</div>}
      {!isActive && (
        <div className="dm-premium-plans">
          {PREMIUM_PLANS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`dm-premium-plan ${selectedPlan === p.id ? "dm-premium-plan-active" : ""}`}
              style={{
                animationDelay: `${i * 0.06}s`,
              }}
              onClick={() => setSelectedPlan(p.id)}
            >
              {p.badge && <span className="dm-premium-plan-badge">{p.badge}</span>}
              <div className="dm-premium-plan-top">
                <span className="dm-premium-plan-name">{p.name}</span>
                {selectedPlan === p.id && (
                  <span className="dm-premium-plan-check">
                    <Check size={13} />
                  </span>
                )}
              </div>
              <div className="dm-premium-plan-price">
                {discountPercent ? (
                  <>
                    <span className="dm-premium-plan-price-strike">{p.price}</span>{" "}
                    {applyDiscount(p.price) || p.price}
                  </>
                ) : (
                  p.price
                )}
                <span className="dm-premium-plan-period"> {p.period}</span>
              </div>
              <div className="dm-premium-plan-sub">
                {discountPercent ? `${discountPercent}% off applied · ${p.sub}` : p.sub}
              </div>
            </button>
          ))}
        </div>
      )}
      {!isActive && (
        <button
          type="button"
          className="dm-premium-cta"
          onClick={() => {
            recordPremiumIntent(plan.id);
            const finalPrice = discountPercent
              ? applyDiscount(plan.price) || plan.price
              : plan.price;
            const priceLabel =
              plan.period === "one-time" ? finalPrice : `${finalPrice}${plan.period}`;
            openTelegramPurchase(`Premium (${plan.name})`, priceLabel);
          }}
        >
          <CrownIcon size={17} />
          {` Get ${plan.name} — ${discountPercent ? applyDiscount(plan.price) || plan.price : plan.price}${plan.period === "one-time" ? "" : plan.period}`}
        </button>
      )}
      {isActive ? (
        showRedeemMore ? (
          promoSection
        ) : (
          <button
            type="button"
            className="dm-premium-redeem-toggle"
            onClick={() => setShowRedeemMore(true)}
          >
            <TagIcon size={13} />
            {" Have another code to redeem?"}
          </button>
        )
      ) : (
        promoSection
      )}
      <div className="dm-settings-section-label">Gems</div>
      <div className="dm-gems-balance-card">
        <GemIcon size={26} className="dm-gems-balance-icon" />
        <div className="dm-gems-balance-text">
          <span className="dm-gems-balance-value">{(gemsBalance || 0).toLocaleString()}</span>
          <span className="dm-gems-balance-label">Gems available</span>
        </div>
      </div>
      <p className="dm-settings-hint dm-gems-hint">
        Gems can be spent around the app on hint reveals, streak freezes and unlockable themes.
      </p>
      <div className="dm-gem-packs">
        {GEM_PACKS.map((pack, i) => (
          <button
            key={pack.id}
            type="button"
            className={`dm-gem-pack ${selectedGemPack === pack.id ? "dm-gem-pack-active" : ""}`}
            style={{
              animationDelay: `${i * 0.06}s`,
            }}
            onClick={() => setSelectedGemPack(pack.id)}
          >
            {selectedGemPack === pack.id && (
              <span className="dm-gem-pack-check">
                <Check size={12} />
              </span>
            )}
            <GemIcon size={22} className="dm-gem-pack-icon" />
            <div className="dm-gem-pack-amount">
              {pack.amount.toLocaleString()}
              {pack.bonus && <span className="dm-gem-pack-bonus">{pack.bonus}</span>}
            </div>
            <div className="dm-gem-pack-price">{pack.price}</div>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="dm-premium-cta dm-gem-cta"
        onClick={() => {
          openTelegramPurchase(`${gemPack.amount.toLocaleString()} gems`, gemPack.price);
        }}
      >
        <GemIcon size={17} />
        {` Get ${gemPack.amount.toLocaleString()} gems — ${gemPack.price}`}
      </button>
      <div className={`dm-premium-notice ${notice ? "dm-premium-notice-show" : ""}`}>
        {notice || "\xA0"}
      </div>
      <p className="dm-settings-hint dm-premium-footnote">
        Choose a plan or gem pack, then tap the button to open Telegram with a ready-made purchase
        message — we'll confirm payment and unlock it for you there.
      </p>
    </div>
  );
}
