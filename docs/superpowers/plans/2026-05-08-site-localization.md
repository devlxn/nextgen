# Site Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add English/Russian language switching for the Dota 2 Tracker UI while preserving Dota entity names and technical metric abbreviations.

**Architecture:** Add a small local i18n layer in the React client with translation dictionaries, a context provider, and a `t()` lookup function. Keep language choice in `localStorage`, wire the provider at the app root, then replace visible UI strings in pages with translation keys.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, React Router.

---

### Task 1: I18n Infrastructure

**Files:**
- Create: `client/src/i18n/translations.ts`
- Create: `client/src/i18n/LanguageContext.tsx`
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Create typed translation dictionaries**

Create `client/src/i18n/translations.ts` with English and Russian dictionaries. Keep hero names, team names, league names, SteamID, OpenDota, KDA, GPM, and XPM untranslated.

- [ ] **Step 2: Add language context**

Create `client/src/i18n/LanguageContext.tsx` with `LanguageProvider`, `useLanguage`, `language`, `setLanguage`, `toggleLanguage`, and `t(key, fallback?)`.

- [ ] **Step 3: Wrap the app**

Wrap `MainApp` with `LanguageProvider` in `client/src/App.tsx`.

### Task 2: Header Toggle

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Translate navigation**

Replace navigation labels with `t()` keys for Dashboard, Search, Heroes, Pro Teams, and Tournaments.

- [ ] **Step 2: Add language button**

Add a compact `EN/RU` button beside the theme toggle. The button must use the same visual density as the existing theme switch and persist the selected language.

### Task 3: Page Translation Pass

**Files:**
- Modify: `client/src/pages/Dashboard.tsx`
- Modify: `client/src/pages/Search.tsx`
- Modify: `client/src/pages/Profile.tsx`
- Modify: `client/src/pages/Matches.tsx`
- Modify: `client/src/pages/PlayerAnalytics.tsx`
- Modify: `client/src/pages/Heroes.tsx`
- Modify: `client/src/pages/HeroMatchups.tsx`
- Modify: `client/src/pages/Leagues.tsx`
- Modify: `client/src/pages/LeagueDetails.tsx`
- Modify: `client/src/pages/ProTeams.tsx`
- Modify: `client/src/pages/MatchDetails.tsx`

- [ ] **Step 1: Translate primary page text**

Replace headings, descriptions, buttons, loading states, empty states, and error labels with translation keys.

- [ ] **Step 2: Preserve Dota entities**

Leave hero names, league names, team names, SteamID, OpenDota, KDA, GPM, and XPM unchanged.

### Task 4: Verification

**Files:**
- Test: `client`

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc -b --noEmit`

Expected: pass.

- [ ] **Step 2: Run focused lint**

Run focused lint on changed localization files and any newly created files. Existing unrelated lint debt may remain in older pages.

- [ ] **Step 3: Smoke test manually**

Start the normal client/server workflow and confirm switching language updates the header and translated page text without changing hero, league, or team names.
