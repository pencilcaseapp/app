# Design decisions

Outcomes of interface explorations, with what was rejected and why, so
the same discussion does not happen twice.

## Settings → Subscription — decided 2026-09-08 from /proto/upgrade, revised 2026-09-19

- Direction: a headline about the reader's own plan over the two plans
  as compact pricing cards in a centred row, the action pinned in the
  dialog footer. Below the cards a free user gets the two-column
  feature matrix; a subscriber has nothing left to compare and gets
  the subscription itself instead, as rows in the matrix's language.
- Headline: "You’ve used 2 of your 5 free docs." (all/over the limit:
  "You’ve used all 5 of your free docs."; subscribed: "You’re on Pencil
  Case Pro."). A free user also gets the subheadline "Unlimited docs,
  and you decide who gets in." — one line in the dialog and the drawer.
- Illustration above the headline: `flying-docs` free, `pencil-and-doc`
  (the two hand in hand) subscribed, 96px tall. Mostly outline, so the
  dark variant inverts cleanly.
- Cards (`PricingCard`, compact): plan name, price, no features, no
  action, no fine print. The current plan sits flat and carries a
  "Current" badge at the end of the plan-name row; the other card is
  tilted. For a free user that is the yellow pro card, the offer; once
  on pro the free card is tilted and greyed out as well, so only one
  card reads as active. Below `sm` the badge moves to a reserved row at
  the top of both cards so the prices keep one baseline.
- Badge colours: `neutral` (grey-200, dark text; grey-800/white in dark
  mode) on the white free card, `dark` (grey-900/white in both themes)
  on the yellow pro card. No rotation on the badges.
- Matrix (`PlanMatrix`, free only): plan names as plain column heads,
  checks and crosses with "Included"/"Not included" for assistive tech,
  the pro column emphasised.
- Status (subscribed): a "Status" row with the badge `CurrentSubscription`
  always had (`success` Active/Trial, `warning` Cancelled, `danger`
  Payment failed), then the date that goes with it as a row of its own
  ("Renews at", "Trial ends at", "Active until"). Complimentary pro gets
  "On the house. Enjoy!" in place of a date. A failed payment is the one
  state to act on, so its sentence is a danger `Notification` right
  above the rows.
- Hints: "Secure checkout by Creem." centred below the cards for a free
  user. No billing line for a subscriber; the button says enough.
- Footer: one button, right. Free: Upgrade to Pro in yellow-500, echoing
  the pro card, with the external link icon because the checkout leaves
  the app. Subscribed: Manage subscription, neutral, same icon; none at
  all for complimentary pro, which has no Creem customer to manage.
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
  - The feature matrix for a subscriber: a comparison for someone who
    has already decided. The status rows fill its place.
  - The pro card alone once subscribed: clean, but the greyed-out free
    card says "you left this behind" better than its absence does.
  - Status as a badge and a line under the headline: competed with the
    headline, and the payment-failed sentence wrapped badly there.
  - The payment-failed notification at the very top of the section:
    pushed the content past the dialog's height.
  - A lone pro `PricingCard` with the status as its badge and the
    features below (the old plan summary, as a card): dropped the
    current-plan comparison the rest of the section is built on.
  - The pencil in a star costume as the pro illustration: its filled
    underside and dotted border turned into heavy white shapes in the
    dark variant.
  - Fine print in the footer next to the button ("Secure checkout by
    Creem.", "Billing lives in the Creem portal."): the hint belongs to
    the cards, and the billing line repeated the button.
