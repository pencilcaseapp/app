# Design decisions

Outcomes of interface explorations, with what was rejected and why, so
the same discussion does not happen twice.

## Settings → Subscription — decided 2026-09-08 from /proto/upgrade

- Direction: a headline about the reader's own usage over a two-column
  feature matrix, the two plans as compact pricing cards in a centred
  row between them, the action pinned in the dialog footer.
- Headline: "You’ve used 2 of your 3 free docs." (all/over the limit:
  "You’ve used all 3 of your free docs."; subscribed: "You’re on Pencil
  Case Pro."), subheadline "Unlimited docs, and you decide who gets in."
  — one line in the dialog and the drawer.
- Illustration above the headline: `flying-docs` free, `welcoming-pencil`
  subscribed, 96px tall.
- Cards (`PricingCard`, compact): plan name, price, no features, no action, no fine
  print. The current plan carries a "Current" badge at the end of the
  plan-name row; below `sm` the badge moves to a reserved row at the top
  of both cards so the prices keep one baseline.
- Badge colours: `neutral` (grey-200, dark text; grey-800/white in dark
  mode) on the white free card, `dark` (grey-900/white in both themes)
  on the yellow pro card. No rotation on the badges.
- Matrix (`PlanMatrix`): plan names as plain column heads, checks and
  crosses with "Included"/"Not included" for assistive tech, the pro
  column emphasised.
- Footer: fine print left, one button right. Free: "Secure checkout by
  Creem." + Upgrade to Pro. Subscribed: "Billing lives in the Creem
  portal." + Manage subscription.
- Rejected:
  - Cards side by side (the previous implementation): the pro feature
    list scrolled out of the short dialog and the two cards competed.
  - Plain compact text column heads (Ledger): fine, but the pricing
    cards tie the section to the upgrade dialog's card language.
  - One editorial message without a comparison (Statement): never shows
    the current plan, which reads evasive in settings.
  - Settings rows with the pitch behind a disclosure (Rows): one extra
    click and a scroll for someone who came here to upgrade.
  - Pricing cards as table column heads: at drawer width the plan names,
    the price periods and the feature labels all wrapped.
  - Badge straddling the card's top edge: looked off on desktop.
  - Current plan as a fine-print line in the card, and buttons inside the
    cards (Current plan / Upgrade to Pro): the buttons doubled the footer
    primary and the fine print was a line the cards did not need.
  - Blue/green semantic badges: the only colours the section did not
    otherwise use. Grey-500 on yellow: too close to the plan label.
- Open: `FREE_DOCUMENT_LIMIT` is 3 in code; the product may give 5.
