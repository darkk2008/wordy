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

  // Minimal list: plain rows in a few groups. `value` is the small text on the right.
  const GROUPS = [
    [
      { id: "account", name: "Account", icon: <UserIcon size={20} />, value: signedIn ? String(account.id) : "Sign in" },
      { id: "premium", name: "Premium", icon: <CrownIcon size={20} />, value: isPremium ? "Active" : "Upgrade" },
    ],
    [
      {
        id: "languages",
        name: "Languages",
        icon: <GlobeIcon size={20} />,
        value: (
          <span className="dm-sx-langs">
            <FlagIcon code={nativeLangObj.flagCode} className="dm-sx-flag" />
            <ArrowRight size={12} />
            <FlagIcon code={learningLangObj.flagCode} className="dm-sx-flag" />
          </span>
        ),
      },
      { id: "appearance", name: "Appearance", icon: <PaletteIcon size={20} /> },
      { id: "notifications", name: "Notifications", icon: <BellIcon size={20} />, value: dailyGoal ? `Goal ${dailyGoal}` : null },
      { id: "families", name: "Families", icon: <UsersIcon size={20} /> },
    ],
    [
      { id: "stats", name: "Your Stats", icon: <BarChartIcon size={20} />, value: streak > 0 ? `${streak} day streak` : null },
      { id: "archived", name: "Archived Stacks", icon: <ArchiveIcon size={20} />, value: archivedCount ? String(archivedCount) : null },
      { id: "restrictions", name: "Guardrails", icon: <ShieldIcon size={20} /> },
    ],
    [
      { id: "qrsync", name: "Sync via QR", icon: <QrCode size={20} /> },
      { id: "data", name: "Data & Backup", icon: <DatabaseIcon size={20} /> },
      { id: "about", name: "About", icon: <InfoIcon size={20} /> },
      { id: "contacts", name: "Contacts", icon: <SendIcon size={20} /> },
    ],
  ];
  return (
    <div className="dm-view dm-sx">
      <h1 className="dm-sx-title">Settings</h1>
      {GROUPS.map((rows, gi) => (
        <div className="dm-sx-group" key={gi}>
          {rows.map((r) => (
            <button key={r.id} type="button" className="dm-sx-row" onClick={() => setSection(r.id)}>
              <span className="dm-sx-icon">{r.icon}</span>
              <span className="dm-sx-name">{r.name}</span>
              {r.value ? <span className="dm-sx-value">{r.value}</span> : null}
              <ChevronRight size={16} className="dm-sx-chev" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
