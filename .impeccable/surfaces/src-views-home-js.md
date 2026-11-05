---
version: 1
slug: "src-views-home-js"
primary_target: "src/views/home.js"
related_targets: ["src/views/addItem.js","src/views/archive.js","src/views/me.js","src/views/login.js","src/views/onboarding.js","src/views/nav.js","src/style.css"]
---

## Direction contract

THESIS: H7 List reads as a shared duty board, not a to-do app. The category default this refuses is the flat checklist card — rows on a blank white ground with a lone accent color doing all the work. Instead the shell itself is the committed surface: a deep enamel board that every row is ruled onto, the way a real household's shift/duty board at a hostel, hospital ward, or ferry terminal is read by five people who already know how to scan it without thinking.

OWN-WORLD: Ground is a committed deep petrol-teal-black enamel (#132A26), not neutral grey and not warm cream/paper — this is a board, not a page. White/warm-white hairline rules divide it into category row-groups (Groceries, Bills, Repairs, Misc), each with its own small accent chip color: amber-gold for Groceries, sky blue for Bills, rust-orange for Repairs, soft violet for Misc. Every assigned item carries a laminated name-tag chip (rounded, initials, that assignee's own color) — the signature move, read instantly as "who's on this." Done items get a hard chalk-marker strikethrough in muted sage, never fade/grey-out. "Need help" is a small amber flare icon on the tag, never a reassignment control. Type is IBM Plex Sans for labels/UI, IBM Plex Mono for every number — prices, totals, timestamps — so the ledger math reads with receipt-like precision against the sans UI text.

STORY: Any of the five brothers opens the app and, in under a second, reads the board the way they'd read the chore roster taped by the kitchen: what's left, grouped by where you'd go for it, who's got it, and what's owed. They act (check off, flag for help, log a cost) without hunting for controls — every control is a standard one, just rendered in the board's own ruled, tagged language.

FIRST VIEWPORT (Home): Top strip is a slim running ledger line in mono numerals — total owed, to whom, right there, no drill-down needed. Below it, the board itself fills the viewport: category row-groups stacked with bold rule dividers between them, category label as a small colored tab on the left edge of its group, each item row showing the name-tag chip, item name, and (if logged) its cost in mono type at the row's right edge. No card shadows, no rounded card containers floating on grey — rows live directly on the enamel ground, separated by rule lines, the way a real board has no "cards." Primary action (Add item) is a single tag-shaped button fixed bottom-right, in the board's own accent language, not a generic FAB.

FORM: The Duty Roster — assigned direction, candidate 3 of 7 grounded candidates ordered by resonance (seed key fa4e47ad, degraded roll, no network challengers available).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
