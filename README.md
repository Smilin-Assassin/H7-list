# H7 List

A shared, real-time shopping & task list for the H7 household — sign in with
phone or email, add items, assign them, check them off, and settle up who
paid for what. Built as an installable PWA (no app store needed).

This file is the step-by-step setup guide. Follow it in order — nothing
after step 1 can be done until step 1 is done, and so on.

## What you'll need

- A Google account (for Firebase) — your existing Gmail works.
- Your GitHub account (`Smilin-Assassin`) — code lives there, and it's what
  deploys the app automatically every time it changes.
- About 20–30 minutes the first time. After that, updates deploy themselves.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com and sign in.
2. Click **Add project**. Name it `h7-list` (or anything you like).
3. You can turn Google Analytics off — not needed. Click **Create project**.

## 2. Register a web app inside it

1. On the project overview page, click the **`</>`** (web) icon to add a web app.
2. Give it a nickname like "H7 List web". You do **not** need Firebase Hosting
   ticked here — leave it unticked.
3. Click **Register app**. It'll show you a block of code with a
   `firebaseConfig = { apiKey: ..., ... }` object — **keep this tab open**,
   you'll copy values from it in step 6.

## 3. Turn on sign-in methods

1. In the left sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable:
   - **Phone** — toggle it on, save.
   - **Email link (passwordless sign-in)**: enable **Email/Password**, then
     toggle on "Email link (passwordless sign-in)" underneath it, save.
3. Still on the Authentication page, go to **Settings → Authorized domains**
   and add the domain your app will live at (you'll get this in step 9 —
   come back and add it then; `localhost` is already there for testing).

## 4. Turn on Firestore (the database)

1. **Build → Firestore Database → Create database**.
2. Choose a location close to the Maldives (e.g. `asia-south1` (Mumbai) or
   similar) — this can't be changed later.
3. Start in **production mode** (the security rules are already written for
   you in `firestore.rules` and get deployed automatically).

## 5. Turn on Cloud Messaging (push notifications)

1. **Build → Cloud Messaging**. Nothing to toggle here.
2. On the same page, scroll to **Web configuration** and click **Generate
   key pair** under "Web Push certificates". Copy the long key shown — you'll
   need it in step 6.

## 6. Fill in your config (done for you, just paste values)

Open these two files and replace every `REPLACE_ME`:

- `src/firebase-config.js` — paste in the `apiKey`, `authDomain`,
  `projectId`, `storageBucket`, `messagingSenderId`, `appId` from step 2,
  and the `vapidKey` from step 5.
- `sw.js` — paste the **same** `apiKey` / `authDomain` / `projectId` /
  `storageBucket` / `messagingSenderId` / `appId` values near the top (a
  service worker can't share the other file, so it needs its own copy).
- `.firebaserc` — replace `YOUR_FIREBASE_PROJECT_ID` with your actual
  project ID (shown on the Firebase console's project settings page).

Send me these values (or just tell me to grab them from a screenshot) and
I'll fill the files in for you if you'd rather not edit them yourself.

## 7. Push the code to GitHub

Tell me when you've done steps 1–6, and I'll create the GitHub repo under
your account and push everything — no git commands for you to run.

## 8. Let GitHub deploy it automatically

This repo deploys itself to Firebase Hosting every time code changes, via
`.github/workflows/deploy.yml`. For that to work, it needs two secrets:

1. In the Firebase console: **Project settings (gear icon) → Service
   accounts → Generate new private key**. This downloads a `.json` file —
   treat it like a password, don't share it publicly.
2. In your GitHub repo: **Settings → Secrets and variables → Actions → New
   repository secret**:
   - Name: `FIREBASE_SERVICE_ACCOUNT` — value: the entire contents of that
     `.json` file.
   - Name: `FIREBASE_PROJECT_ID` — value: your project ID from step 2.
3. Push (or ask me to push) anything to the `main` branch and it deploys
   automatically. You can watch it run under the repo's **Actions** tab.

## 9. Add your real deployed address to Firebase

Once it's deployed once, Firebase gives your app a web address like
`h7-list.web.app`. Go back to step 3's **Authorized domains** list and add
that address — otherwise sign-in will fail on the live site.

## 10. Install it on everyone's phone

Open the deployed link on each brother's phone in their browser:

- **Android (Chrome)**: a banner offers "Install app" — tap it. Push
  notifications work right away.
- **iPhone (Safari)**: tap the Share icon → **Add to Home Screen**. This step
  is required on iPhone before push notifications will arrive at all — the
  browser tab alone can't receive them.

## About Cloud Messaging and cost

Everything except "notify everyone when something changes" runs on
Firebase's free (Spark) plan. Sending a push to someone else's phone when
you add an item requires a small server-side function (already written, in
`functions/`), and Cloud Functions requires Firebase's pay-as-you-go
(Blaze) plan to even deploy — it has a generous free monthly allowance, and
a household list won't come close to it, but it does mean adding a billing
card to the Firebase project. If you'd rather skip that for now, everything
still works live while the app is open — you just won't get a notification
when it's closed. Say the word and I'll pull the Functions piece out
entirely instead.

## A couple of judgment calls I made — flag if you want these different

- **Reimbursement math**: when a list fully clears, the archive splits the
  total cost evenly across everyone who's joined and shows who owes whom to
  settle up. If your household doesn't split evenly (e.g. the finance lead
  fronts everything and isn't owed a share), tell me and I'll change the formula.
- **Email sign-in** is a tap-the-link flow, not a typed 6-digit code —
  Firebase doesn't offer numeric codes over email natively. Phone sign-in
  does use a real 6-digit SMS code.
- Member names are typed in once by each brother the first time they sign in
  (no pre-set names) — nobody needed to tell me who's who in advance.
