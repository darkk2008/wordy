# Premium in wwordy: status and how to switch it back on

**Current status: Premium is switched OFF.** The app is completely free. The Premium code, the
`entitlements` table, the promo-code functions and the admin panel are all still in the project and
untouched; they are just hidden behind one master switch.

## The switch

`src/boot/config.js`:

```js
window.DM_CONFIG = {
  ...
  premiumEnabled: false,   // <- change to true to turn the whole Premium system back on
};
```

## What `premiumEnabled: false` does

- `isPremium` (in `src/app/app.jsx`) is `true` for everyone, so every lock opens: all themes, unlimited
  families, mini-stacks, all games without cooldowns, "All forms" tables, romanization.
- No upsell is shown anywhere: the Pro button on Home and in the stack view, the Premium row in
  Settings, the Premium FAQ entry in About, locked badges. The cloud is no longer asked about Pro.
- **AI is the exception**, because it costs real money. `hasPro` (the real subscription state) still
  guards background AI generation. The AI Tutor chat and the translator are open to everyone but share a
  daily limit of `FAIR_USE_AI_LIMIT` (30, in `src/services/premium-status.js`), counted in the browser
  (`localStorage`). The limit message has no upgrade link.
- `public/welcome.html` says the app is free. `public/terms.html` section 6 and `public/privacy.html`
  still describe Premium and promo codes; review them before launch.

## What `premiumEnabled: true` restores

The original behavior exactly: free limits (1 family, 8 themes, 10 AI translations per day, locked
games/forms/AI chat, game cooldowns) and the Premium screen with promo codes. Pro comes only from the
Supabase `entitlements` table (`supabase-entitlements.sql`), set by promo codes
(`netlify/functions/promo-redeem.mjs`) or the admin panel (open `#admin` with the admin secret,
`netlify/functions/promo-admin.mjs`).

## Checklist before turning it on

1. Set `premiumEnabled: true` and redeploy. Tests: `npm test`.
2. Confirm `supabase-entitlements.sql` was run and the Netlify env vars used by `promo-admin` /
   `promo-redeem` are set (see `netlify/lib/README.md`).
3. Known issues that matter once money or codes are involved (found in the code review):
   - `promo-redeem.mjs` is not atomic: two parallel requests can redeem the same code.
   - `ai-proxy.cjs` has no authentication and the daily AI limit is only checked in the browser, so the
     shared AI key can be used directly. Verify the Supabase token and count usage on the server.
4. Real card payments are not built. Plan discussed: a `checkout-create` function (verifies the Supabase
   token), a `payment-webhook` function (verifies the signature, ignores repeated events, then grants
   Pro through the same entitlements logic), and Buy buttons in `premium-settings.jsx`.
5. Update `public/welcome.html` FAQ ("Is wwordy free?") and `public/terms.html`.

## For an AI assistant picking this up in a new chat

Read this file first, then `src/boot/config.js`, `src/services/premium-status.js` and
`src/app/app.jsx` (search for `premiumEnabled` and `hasPro`). Nothing from earlier chats is remembered,
so this file is the source of truth. To "turn Premium on", follow the checklist above.
