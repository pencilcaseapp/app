# End-to-end tests

Playwright drives a real browser against the dev server (`npm run dev`),
so the whole stack is under test: the Express server, the React Router
app, the websocket live server, and the dev Postgres and Redis from
`npm run docker:up`.

```bash
npm run e2e      # headless; starts the dev server itself if none is running
npm run e2e:ui   # Playwright's UI mode for writing and debugging tests
```

Tests live in `e2e/`, configured by `playwright.config.ts`. Locally a dev
server you already have running is reused; in CI (`ci.yml`, job `e2e`)
Playwright starts its own after `npm run docker:up` — the same Docker
Compose services as local dev. The browser binaries are cached keyed on
the Playwright version, so Chromium is only downloaded again when
Playwright (and with it its pinned browser build) is upgraded.

## Layout

```
e2e/
  setup/     the Playwright setup project (auth.setup.ts)
  fixtures/  the `test` fixtures, the AppUser flows and the page objects
  utils/     helpers that are not fixtures (test accounts, images)
  specs/     one spec per domain of the app
```

A spec covers one domain, not one feature: everything that happens in
the editor (documents, images, collaboration, sharing, deletion) lives
in `specs/editor.spec.ts`, each feature in a `test.describe` of its own,
and signing in and out in `specs/auth.spec.ts`. The settings dialog
and its account section are `specs/settings-overview.spec.ts`; a flow
with its own steps in there (the subscription, changing the email) is
a domain of its own, `specs/settings-<flow>.spec.ts`. A new test joins the spec and the
describe block of its domain; only a new domain starts a new spec.

## Authentication

The tests sign in through the real form, as test accounts
(`config.testAccounts`): any address at `pencilcase.test` signs in with
the code `000000` and is never mailed one. `signIn` in
`e2e/utils/sign-in.ts` fills in the address and the code and skips
the onboarding, and comes back to the sign-in page instead of the start
page, which would create a document for the user. Every test account
goes through the same OTP row, attempts and rate limit (three codes per
fifteen minutes) as a real address, so each user gets an address nobody
has used before (`createTestAccountEmail` in `e2e/utils/test-accounts.ts`).
Forms stay disabled until the page has hydrated (`ControlledForm`), and
Playwright waits for a field to be enabled before it fills it, so no
test has to wait for hydration itself.

`e2e/setup/auth.setup.ts` runs once as a Playwright "setup" project: it
signs a fresh test account in and saves the cookie to
`e2e/.auth/user.json` (gitignored), which every test then loads via
`storageState` — tests start signed in without repeating the sign-in.

## Fixtures and shared flows

Specs import `test` and `expect` from `e2e/fixtures/test.ts` instead of
`@playwright/test`. The base test is extended with signed in users:

- `user` — the storage-state user from the setup project above.
- `userA` / `userB` — test accounts signed in fresh for the test, each
  in a browser context of their own. Multi-user scenarios (sharing,
  live collaboration, revocation) put both into the same document
  without them sharing cookies, and a fresh user keeps sidebar
  assertions independent of documents left behind by earlier runs.

Each user is an `AppUser` wrapping the flows the specs share:
creating and opening documents, typing, toggling sharing, finding a
document in the sidebar. The flows also carry the synchronisation that
keeps the live-server tests stable — `createDocument`/`openDocument`
wait for the websocket to deliver the server-seeded heading before
anyone types, and toggling sharing waits for the share action's round
trip before the link is handed to the other user (or their access is
expected to be gone).

A domain whose pages have flows of their own extends that test once
more, the way Playwright's docs build page object fixtures. The auth
spec imports its `test` from `e2e/fixtures/auth/test.ts`: `page` starts
without a session there, and `signInPage`, `otpPage` and
`onboardingPage` hand out one page object per screen of the sign-in
(`e2e/fixtures/auth/`), which `signIn` drives as well.

## The Creem checkout

`e2e/specs/settings-subscription.spec.ts` drives Creem's real test-mode
checkout: open the subscription settings from the sidebar, upgrade, pay with the
always-succeeding test card on their hosted page, follow the signed
redirect back into the settings, see pro switched on and the customer
portal open. That buys real end-to-end confidence at the
price of depending on Creem being up and their checkout page keeping
its shape — the card-form locators in the spec are the one place to
adjust when it changes.

The paid spec needs `CREEM_API_KEY` (the playwright config loads
`.env`, so the same entry serves the dev server and the tests). A
local run without the key skips it; CI gets it as a repository secret
and fails loudly when the secret is missing, so the paid flow can
never fall out of CI unnoticed. Every run leaves a throwaway customer and subscription
behind in the test store. Webhook lifecycle behaviour (cancellations,
failed renewals, redeliveries) is deliberately not covered here —
Creem cannot deliver webhooks to localhost or a CI runner — and lives
in the service tests instead; see `docs/subscriptions.md`.

Subscription state sticks to the user, so the spec uses the fresh
`userA` fixture, never the shared storage-state `user`.
