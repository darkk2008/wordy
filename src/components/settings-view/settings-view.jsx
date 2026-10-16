/* components/settings-view/settings-view.jsx
 * SettingsView (settings menu).
 */

import { Fragment, useEffect, useState } from "react";
import { AboutSettings, AppAboutSettings } from "../about-settings/about-settings";
import { AccountSettings } from "../account/account";
import { QRSyncSettings } from "../qr-sync-settings/qr-sync-settings";
import { AppearanceSettings } from "../appearance-settings/appearance-settings";
import { ArchivedStacksSettings } from "../archived-stacks-settings/archived-stacks-settings";
import { ContactsSettings } from "../contacts-settings/contacts-settings";
import { DataSettings } from "../data-settings/data-settings";
import { FamiliesSettings } from "../families-settings/families-settings";
import { ArrowRight, DatabaseIcon, QrCode, SendIcon, UserIcon } from "../icons/icons";
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
  stickyFilters,
  onToggleStickyFilters,
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
  initialSection,
  onConsumeInitialSection,
  isPremium,
  onPremiumChange,
  onExitToPreviousTab,
  gemsBalance,
  onAddGems,
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
      <PremiumSettings onBack={backAndRefresh} gemsBalance={gemsBalance} onAddGems={onAddGems} />
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
        stickyFilters={stickyFilters}
        onToggleStickyFilters={onToggleStickyFilters}
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
  const SECTIONS = [
    {
      id: "premium",
      name: "Premium",
      desc: "Plans, pricing & promo code",
      icon: <CrownIcon size={22} />,
      premium: true,
    },
    {
      id: "account",
      name: "Account",
      desc:
        account && account.id ? `Signed in as ${account.id}` : "Sign up or sign in to sync devices",
      icon: <UserIcon size={22} />,
    },
    {
      id: "contacts",
      name: "Contacts",
      desc: "Get in touch with us",
      icon: <SendIcon size={22} />,
      contacts: true,
    },
    {
      id: "appearance",
      name: "Appearance",
      desc: "Theme and colors",
      icon: <PaletteIcon size={22} />,
    },
    {
      id: "languages",
      name: "Languages",
      desc: (
        <span className="dm-settings-flag-desc">
          <FlagIcon code={nativeLangObj.flagCode} className="dm-settings-flag-desc-icon" />
          <ArrowRight size={11} className="dm-settings-flag-desc-arrow" />
          <FlagIcon code={learningLangObj.flagCode} className="dm-settings-flag-desc-icon" />
        </span>
      ),
      icon: <GlobeIcon size={22} />,
    },
    {
      id: "families",
      name: "Families",
      desc: "Organize your stacks",
      icon: <UsersIcon size={22} />,
    },
    {
      id: "notifications",
      name: "Notifications",
      desc: "Reminders and daily goal",
      icon: <BellIcon size={22} />,
    },
    {
      id: "restrictions",
      name: "Guardrails",
      desc: "Privacy, layout & word display",
      icon: <ShieldIcon size={22} />,
    },
    {
      id: "stats",
      name: "Your Stats",
      desc: "Progress, streaks & words",
      icon: <BarChartIcon size={22} />,
    },
    {
      id: "archived",
      name: "Archived Stacks",
      desc: `${(archivedStacks || []).length} archived`,
      icon: <ArchiveIcon size={22} />,
    },
    {
      id: "qrsync",
      name: "Sync via QR",
      desc: "Send stacks to another device",
      icon: <QrCode size={22} />,
    },
    {
      id: "data",
      name: "Data & Backup",
      desc: "Export, import or reset",
      icon: <DatabaseIcon size={22} />,
    },
    {
      id: "about",
      name: "About",
      desc: "How wwordy works",
      icon: <InfoIcon size={22} />,
    },
  ];
  return (
    <div className="dm-view">
      <div className="dm-header">
        <div>
          <div className="dm-eyebrow">Customize</div>
          <h1 className="dm-h1">Settings</h1>
        </div>
      </div>
      {[
        ["Account", ["premium", "account", "qrsync"]],
        ["Learning", ["languages", "families", "stats", "archived"]],
        ["App", ["appearance", "notifications", "restrictions"]],
        ["Data & help", ["data", "about", "contacts"]],
      ].map(([groupLabel, ids], gi) => (
        <Fragment key={groupLabel}>
          <div
            className="dm-settings-group-label"
            style={{ animationDelay: `${Math.max(0, gi * 3 * 0.05 - 0.04)}s` }}
          >
            {groupLabel}
          </div>
          <div className="dm-settings-grid">
            {ids
              .map((id) => SECTIONS.find((x) => x.id === id))
              .filter(Boolean)
              .map((s, i) => (
                <button
                  key={s.id}
                  className={`dm-settings-card ${s.premium ? "dm-settings-card-premium" : ""} ${s.contacts ? "dm-settings-card-contacts" : ""}`}
                  style={{
                    animationDelay: `${(gi * 3 + i) * 0.05}s`,
                  }}
                  onClick={() => setSection(s.id)}
                >
                  <div className="dm-settings-card-icon">{s.icon}</div>
                  <div className="dm-settings-card-name">{s.name}</div>
                  <div className="dm-settings-card-desc">{s.desc}</div>
                </button>
              ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
