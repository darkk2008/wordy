/* components/settings-view/settings-view.jsx
 * SettingsView (settings menu).
 */

import { useEffect, useState } from "react";
import { AboutSettings, AppAboutSettings } from "../about-settings/about-settings";
import { AccountSettings } from "../account/account";
import { QRSyncSettings } from "../qr-sync-settings/qr-sync-settings";
import { AppearanceSettings } from "../appearance-settings/appearance-settings";
import { ArchivedStacksSettings } from "../archived-stacks-settings/archived-stacks-settings";
import { ContactsSettings } from "../contacts-settings/contacts-settings";
import { DataSettings } from "../data-settings/data-settings";
import { FamiliesSettings } from "../families-settings/families-settings";
import { ArrowRight, ChevronRight, DatabaseIcon, QrCode, SendIcon, UserIcon } from "../icons/icons";
import {
  ArchiveIcon,
  BarChartIcon,
  BellIcon,
  CrownIcon,
  GlobeIcon,
  InfoIcon,
  PaletteIcon,
  ShieldIcon,
  UsersIcon,
} from "../icons/settings-icons";
import { FlagIcon, LANGUAGES, LanguagesSettings } from "../language-settings/language-settings";
import { NotificationSettings } from "../notification-settings/notification-settings";
import { PremiumSettings } from "../premium-settings/premium-settings";
import { RestrictionsSettings } from "../restrictions-settings/restrictions-settings";

export function SettingsView({
  theme,
  onSelectTheme,
  streak,
  stacks,
  archivedStacks,
  onUnarchiveStack,
  onPlayArchivedStack,
  families,
  onCreateFamily,
  onRenameFamily,
  onDeleteFamily,
  onSetFamilyEmoji,
  onImportFamily,
  onOpenStack,
  onPlayFamilyGames,
  showFamilyStats,
  onToggleShowFamilyStats,
  hideFamilyFilters,
  onToggleHideFamilyFilters,
  restrictCopy,
  onToggleRestrictCopy,
  hideArticles,
  onToggleHideArticles,
  showLevelBadge,
  onToggleShowLevelBadge,
  translateForms,
  onToggleTranslateForms,
  dueCount,
  todayReviews,
  bestStreak,
  onImportAllData,
  onResetAllData,
  dailyGoal,
  onSetDailyGoal,
  nativeLanguage,
  learningLanguage,
  onSetNativeLanguage,
  onSetLearningLanguage,
  uiLanguage,
  uiLanguageCustom,
  onSetUiLanguage,
  onResetUiLanguage,
  initialSection,
  onConsumeInitialSection,
  isPremium,
  onPremiumChange,
  onExitToPreviousTab,
  account,
  onOpenAuth,
  onSignOut,
  onSyncNow,
  onDeleteAccount,
  onCreateStack,
}) {
  const totalWords = stacks.reduce((s, st) => s + st.words.length, 0);
  const [section, setSection] = useState(initialSection || null);
  const [enteredViaPremiumButton] = useState(initialSection === "premium");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [section]);
  useEffect(() => {
    if (initialSection && onConsumeInitialSection) onConsumeInitialSection();
  }, []);
  const backAndRefresh = () => {
    if (enteredViaPremiumButton && onExitToPreviousTab) {
      onExitToPreviousTab();
      return;
    }
    setSection(null);
    if (onPremiumChange) onPremiumChange();
  };
  if (section === "premium")
    return (
      <PremiumSettings onBack={backAndRefresh} />
    );
  if (section === "appearance")
    return (
      <AppearanceSettings
        theme={theme}
        onSelectTheme={onSelectTheme}
        onBack={() => setSection(null)}
        isPremium={isPremium}
        onOpenPremium={() => setSection("premium")}
      />
    );
  if (section === "notifications")
    return (
      <NotificationSettings
        onBack={() => setSection(null)}
        dailyGoal={dailyGoal}
        onSetDailyGoal={onSetDailyGoal}
      />
    );
  if (section === "families")
    return (
      <FamiliesSettings
        onBack={() => setSection(null)}
        families={families}
        stacks={stacks}
        onCreateFamily={onCreateFamily}
        onRenameFamily={onRenameFamily}
        onDeleteFamily={onDeleteFamily}
        onSetFamilyEmoji={onSetFamilyEmoji}
        onImportFamily={onImportFamily}
        onOpenStack={onOpenStack}
        onPlayFamilyGames={onPlayFamilyGames}
        isPremium={isPremium}
        onOpenPremium={() => setSection("premium")}
      />
    );
  if (section === "restrictions")
    return (
      <RestrictionsSettings
        onBack={() => setSection(null)}
        restrictCopy={restrictCopy}
        onToggleRestrictCopy={onToggleRestrictCopy}
        showFamilyStats={showFamilyStats}
        onToggleShowFamilyStats={onToggleShowFamilyStats}
        hideFamilyFilters={hideFamilyFilters}
        onToggleHideFamilyFilters={onToggleHideFamilyFilters}
        hideArticles={hideArticles}
        onToggleHideArticles={onToggleHideArticles}
        showLevelBadge={showLevelBadge}
        onToggleShowLevelBadge={onToggleShowLevelBadge}
        translateForms={translateForms}
        onToggleTranslateForms={onToggleTranslateForms}
      />
    );
  if (section === "stats")
    return (
      <AboutSettings
        onBack={() => setSection(null)}
        streak={streak}
        bestStreak={bestStreak}
        totalWords={totalWords}
        stacks={stacks}
        families={families}
        dueCount={dueCount}
        todayReviews={todayReviews}
        dailyGoal={dailyGoal}
      />
    );
  if (section === "data")
    return (
      <DataSettings
        onBack={() => setSection(null)}
        stacks={stacks}
        families={families}
        streak={streak}
        bestStreak={bestStreak}
        todayReviews={todayReviews}
        onImportAll={onImportAllData}
        onResetAll={onResetAllData}
      />
    );
  if (section === "archived")
    return (
      <ArchivedStacksSettings
        onBack={() => setSection(null)}
        archivedStacks={archivedStacks}
        onUnarchiveStack={onUnarchiveStack}
        onPlayArchivedStack={onPlayArchivedStack}
        onOpenStack={onOpenStack}
        families={families}
      />
    );
  if (section === "languages")
    return (
      <LanguagesSettings
        onBack={() => setSection(null)}
        nativeLanguage={nativeLanguage}
        learningLanguage={learningLanguage}
        onSetNativeLanguage={onSetNativeLanguage}
        onSetLearningLanguage={onSetLearningLanguage}
        uiLanguage={uiLanguage}
        uiLanguageCustom={uiLanguageCustom}
        onSetUiLanguage={onSetUiLanguage}
        onResetUiLanguage={onResetUiLanguage}
      />
    );
  if (section === "about") return <AppAboutSettings onBack={() => setSection(null)} />;
  if (section === "contacts") return <ContactsSettings onBack={() => setSection(null)} />;
  if (section === "qrsync")
    return (
      <QRSyncSettings
        onBack={() => setSection(null)}
        stacks={stacks}
        onCreateStack={onCreateStack}
        onImportFamily={onImportFamily}
      />
    );
  if (section === "account")
    return (
      <AccountSettings
        onBack={() => setSection(null)}
        account={account}
        onOpenAuth={onOpenAuth}
        onSignOut={onSignOut}
        onSyncNow={onSyncNow}
        onDeleteAccount={onDeleteAccount}
      />
    );
  const nativeLangObj = LANGUAGES.find((l) => l.code === nativeLanguage) || LANGUAGES[0];
  const learningLangObj = LANGUAGES.find((l) => l.code === learningLanguage) || LANGUAGES[1];
  const signedIn = !!(account && account.id);
  const archivedCount = (archivedStacks || []).length;

  // Tiles of the bento grid (the wide ones span two columns on phones and half the row on desktop)
  const TILES = [
    { id: "languages", name: "Languages", tint: "#6aa8ff", icon: <GlobeIcon size={22} />, wide: true },
    { id: "appearance", name: "Appearance", desc: "Theme and colors", tint: "#ff6b9d", icon: <PaletteIcon size={22} /> },
    {
      id: "notifications",
      name: "Notifications",
      desc: dailyGoal ? `Daily goal: ${dailyGoal}` : "Reminders and daily goal",
      tint: "#fbbf24",
      icon: <BellIcon size={22} />,
    },
    { id: "families", name: "Families", desc: "Organize your stacks", tint: "#a78bfa", icon: <UsersIcon size={22} /> },
    {
      id: "stats",
      name: "Your Stats",
      desc: streak > 0 ? `${streak} day streak` : "Progress, streaks & words",
      tint: "#4ade80",
      icon: <BarChartIcon size={22} />,
    },
    {
      id: "archived",
      name: "Archived Stacks",
      desc: archivedCount ? `${archivedCount} archived` : "Nothing archived",
      tint: "#94a3b8",
      icon: <ArchiveIcon size={22} />,
    },
    {
      id: "restrictions",
      name: "Guardrails",
      desc: "Privacy, layout & word display",
      tint: "#2dd4bf",
      icon: <ShieldIcon size={22} />,
    },
  ];
  // Utility rows at the bottom
  const ROWS = [
    { id: "qrsync", name: "Sync via QR", desc: "Send stacks to another device", tint: "#6ee7f9", icon: <QrCode size={20} /> },
    { id: "data", name: "Data & Backup", desc: "Export, import or reset", tint: "#fb923c", icon: <DatabaseIcon size={20} /> },
    { id: "about", name: "About", desc: "How wwordy works", tint: "#94a3b8", icon: <InfoIcon size={20} /> },
    { id: "contacts", name: "Contacts", desc: "Get in touch with us", tint: "#6aa8ff", icon: <SendIcon size={20} /> },
  ];
  const stagger = (n) => ({ "--i": n });
  return (
    <div className="dm-view dm-sx">
      <h1 className="dm-sx-title" style={stagger(0)}>
        Settings
      </h1>

      <div className="dm-sx-top" style={stagger(1)}>
        <button type="button" className="dm-sx-account" onClick={() => setSection("account")}>
          <span className={`dm-sx-avatar${signedIn ? " is-in" : ""}`}>
            {signedIn ? String(account.id).trim().charAt(0).toUpperCase() : <UserIcon size={22} />}
          </span>
          <span className="dm-sx-account-text">
            <span className="dm-sx-account-name">{signedIn ? "Account" : "Sign in"}</span>
            <span className="dm-sx-account-desc">
              {signedIn ? `Signed in as ${account.id}` : "Sign up or sign in to sync devices"}
            </span>
          </span>
          <ChevronRight size={18} className="dm-sx-chev" />
        </button>
        <button
          type="button"
          className={`dm-sx-premium${isPremium ? " is-active" : ""}`}
          onClick={() => setSection("premium")}
        >
          <span className="dm-sx-premium-icon">
            <CrownIcon size={22} />
          </span>
          <span className="dm-sx-account-text">
            <span className="dm-sx-account-name">Premium</span>
            <span className="dm-sx-account-desc">{isPremium ? "Active · manage your plan" : "Plans, pricing & promo code"}</span>
          </span>
          <ChevronRight size={18} className="dm-sx-chev" />
        </button>
      </div>

      <div className="dm-sx-bento">
        {TILES.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={`dm-sx-tile${t.wide ? " dm-sx-tile-wide" : ""}`}
            style={{ "--tint": t.tint, ...stagger(i + 2) }}
            onClick={() => setSection(t.id)}
          >
            <span className="dm-sx-tile-head">
              <span className="dm-sx-chip">{t.icon}</span>
              <ChevronRight size={16} className="dm-sx-tile-chev" />
            </span>
            {t.id === "languages" ? (
              <span className="dm-sx-tile-foot">
                <span className="dm-sx-tile-name">{t.name}</span>
                <span className="dm-sx-langs">
                  <span className="dm-sx-lang">
                    <FlagIcon code={nativeLangObj.flagCode} className="dm-sx-flag" />
                    {nativeLangObj.name}
                  </span>
                  <ArrowRight size={14} className="dm-sx-langs-arrow" />
                  <span className="dm-sx-lang">
                    <FlagIcon code={learningLangObj.flagCode} className="dm-sx-flag" />
                    {learningLangObj.name}
                  </span>
                </span>
              </span>
            ) : (
              <span className="dm-sx-tile-foot">
                <span className="dm-sx-tile-name">{t.name}</span>
                <span className="dm-sx-tile-desc">{t.desc}</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="dm-sx-list" style={stagger(TILES.length + 2)}>
        {ROWS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="dm-sx-row"
            style={{ "--tint": r.tint }}
            onClick={() => setSection(r.id)}
          >
            <span className="dm-sx-chip dm-sx-chip-sm">{r.icon}</span>
            <span className="dm-sx-account-text">
              <span className="dm-sx-row-name">{r.name}</span>
              <span className="dm-sx-row-desc">{r.desc}</span>
            </span>
            <ChevronRight size={16} className="dm-sx-chev" />
          </button>
        ))}
      </div>
    </div>
  );
}
