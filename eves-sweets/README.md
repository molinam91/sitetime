# Eve's Sweets — Order Online

React + Firebase rebuild of the Claude Artifact bakery ordering app. This replaces the
self-publishing-artifact trick (which had an unfixable staleness/caching problem on some
phones and in-app browsers) with a real Firestore database: every device gets menu, price,
and promo changes instantly, with no caching ambiguity, because there's no static HTML page
being re-published — just live reads from Firestore.

All business rules from the original app are preserved exactly:
- Wednesday 4pm order cutoff → ready that Friday (or the following Friday if the cutoff passed)
- Free delivery once $25+ of the $5-tier items (gelatins, rice pudding) are in the cart
- 2-for-$35 bundle on the $20-tier items (odd quantities: pairs discounted, remainder full price)
- Owner-managed promo codes (free delivery, or a free item above a minimum purchase)
- WhatsApp/SMS order alert on checkout, with the exact same message format
- Owner dashboard behind a PIN, with Menu/Catering/Orders/Share-QR/Settings tabs

One thing changed on purpose: **orders are now written straight to Firestore when the
customer places them**, so the Orders tab is a live, real-time list on every device instead
of the old "paste the WhatsApp message to log it" workaround. That workaround existed only
because the old artifact had no real backend — now that there is one, it's no longer needed.
The WhatsApp/SMS "alert the owner" step is still there and unchanged, since that's still how
the owner gets pinged immediately.

## 1. Create the Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) → **Add project**.
2. Enable **Firestore Database** (production mode is fine — the rules below lock it down).
3. Enable **Authentication → Sign-in method → Email/Password**.
4. In **Authentication → Users**, add exactly one user. Its email doesn't matter (customers
   never see or type it) but it must match `REACT_APP_OWNER_EMAIL` below — the default is
   `owner@eves-sweets.local`. **Its password is the dashboard PIN** the baker will type on
   the "🔒 Baker Login" screen — pick anything at least 6 characters (Firebase's minimum);
   the original PIN was `1234`, but Firebase requires 6+ characters for a password, so choose
   something like `eves1234` if you want to keep it PIN-like.
5. In **Project settings → General → Your apps**, add a Web app and copy its config values
   into a `.env.local` file in this folder (see `.env.example`), or set them directly as
   environment variables in your hosting provider (Netlify/Vercel).

## 2. Set the Firestore security rules

In the Firebase console, go to **Firestore Database → Rules** and paste in the contents of
`firestore.rules` from this folder, then Publish. Short version of what it does:
- Menu items and business settings: anyone can read (that's the public ordering page),
  only the signed-in owner can write.
- Orders: anyone can create one (that's how customers place orders without an account);
  only the signed-in owner can read, edit, or delete them.
- The shared order-number counter can only ever be incremented by exactly 1 at a time.

**Note on the promo codes / business settings being publicly readable:** this matches the
original app, which embedded its entire settings JSON (including the PIN) in the public page
source — anyone could already view-source it. This rebuild is not a regression on that front,
but if you'd like the dashboard PIN to stop being a plaintext value anywhere, that's already
true here: the real gate is a Firebase Auth password (see step 1.4), and the `pin` field
from the old data is no longer used or stored.

## 3. Import the current live menu (one-time)

The first time you open the dashboard (Settings tab) after deploying with an empty Firestore
database, you'll see an **"Import your current live menu"** button. It seeds Firestore with
the exact menu items, prices, photos, and settings that are live right now on the old
Claude Artifact page (bundled in `src/data/seedData.json`), so you don't have to re-enter
everything by hand. It only appears while the menu collection is empty, so it's safe to run
once and never worry about it again.

## 4. Run it locally

```
npm install
cp .env.example .env.local   # fill in your Firebase config
npm start
```

## 5. Deploy

Any static host works since this is a plain Create React App build (`npm run build` produces
a `build/` folder). Netlify and Vercel both auto-detect this; just set the same
`REACT_APP_FIREBASE_*` / `REACT_APP_OWNER_EMAIL` environment variables in their project
settings that you used in `.env.local`. Once deployed, share the new URL (Dashboard → Share/QR
tab has a QR code + copy-link button) — this is the one-time link change the original handoff
doc already flagged as an accepted cost of moving off Claude Artifact hosting.

## Notes for whoever maintains this next

- Photos are still stored as base64 JPEGs (resized to ~380px, quality 0.55) directly on each
  menu item's Firestore document — same approach as before, but the old app's real bug (an
  11-item menu growing into a single 1.5MB JSON blob that took 20–30s to save) can't happen
  anymore, because every item is now its own small Firestore document that saves independently
  and instantly. Firestore's 1MiB-per-document limit is nowhere close to being hit by a single
  resized photo.
- The dashboard "PIN" is the password of one fixed Firebase Auth account (see step 1.4). This
  is what makes the Firestore write rules enforceable server-side — the original PIN check ran
  entirely in client JS with no backend to actually stop a determined visitor.
- `src/lib/business.js` holds every pure business rule (cutoff date math, both promos, promo
  code logic, the WhatsApp/SMS message format) as plain functions with no React or Firebase
  dependency, ported directly from the original single-file app.
