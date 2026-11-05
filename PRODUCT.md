# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The five brothers of household H7, coordinating shared apartment logistics from their own phones. One of them (the eldest) also acts as finance lead, fronting or tracking shared spend.

## Product Purpose

A shared, real-time shopping/task list for the household so nobody duplicates a trip, nobody forgets what's needed, and spend is traceable back to whoever paid. Success is: anyone can glance at the list and know what's left, who's on it, and who to pay back.

## Positioning

Not a generic shared note or to-do app. Its mechanism is accountable task ownership: an item can be assigned to one person, who cannot pass it off but can flag that they need help; items carry a category so people know where to go; completed items stay visible (struck through) until the whole list clears, then move to an archive; every purchase records cost and buyer so the finance lead can reconcile and reimburse.

## Operating Context

Used entirely on phones, installed as a PWA to the home screen. Login is passwordless — phone OTP or an email sign-in link. Firestore listeners keep the list live across all five phones. Push notifications currently fire only while the app is open in the foreground; true background/closed-app push (via a Cloud Function trigger) is built but not deployed.

## Capabilities and Constraints

- Firebase Authentication (phone OTP, email link), Firestore (realtime), Firebase Hosting, deployed via GitHub Actions on push to `main`.
- Built as dependency-free static ES modules (no bundler/npm) loaded via CDN — a deliberate constraint from the build environment, not a product requirement, but anything added should keep working without a build step.
- Cloud Functions for background push notifications exist in the repo (`functions/`) but are undeployed; deploying them requires Firebase's Blaze (pay-as-you-go) plan, which the user has chosen to skip for now. Not a dead end — just not live yet.
- The user has no coding background and operates mostly from a phone; any setup step that needs the user's own action must be spelled out plainly, one step at a time.

## Brand Commitments

None fixed yet. "H7 List" is the working name but the user is open to renaming or re-identifying the product as part of this redesign. "H7" itself names the real apartment building and can be referenced or dropped as the new identity sees fit.

## Evidence on Hand

None. This is a private household tool for five known users, not a marketed product — no testimonials, case studies, or external content apply.

## Product Principles

- Ownership is visible and singular — every open item has exactly one accountable person, never ambiguous, never silently reassigned.
- Status survives the group, not the session — what's done, what's open, and who bought what stays legible to all five until the cycle closes itself.
- Money is traceable, not trusted to memory — cost and buyer are recorded at the moment of purchase so reimbursement never depends on someone remembering.
- Friction belongs to setup, not daily use — the complexity of OTP/Firebase/deploy is the builder's problem; day-to-day, it should feel as easy as texting the group chat.

## Accessibility & Inclusion

No specific accessibility requirement established; confirmed as five phone users with no special needs beyond ordinary mobile use.
