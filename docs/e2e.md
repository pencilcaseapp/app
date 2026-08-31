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

## Authentication

Signing in through the real magic-code flow would need an inbox, so the
tests use `POST /e2e/auth` instead: it takes `{ "email": ... }`, creates
(or reuses) the user, marks it onboarded, and answers with a real session
cookie. Three guards keep it out of production:

- The route 404s unless `config.e2e` is set, and `app/config/prod.ts`
  does not set it. Staging gets it later by wiring `e2e` into its config.
- The request must carry `Authorization: Bearer <apiToken>`. Dev defaults
  to `e2e-t0k3n`; `E2E_API_TOKEN` overrides the server and the tests in
  one go (staging should use a real secret).
- The session it creates is an ordinary `sessions` row — nothing about
  the resulting login is special, so revocation and expiry behave as in
  production.

`e2e/auth.setup.ts` runs once as a Playwright "setup" project: it calls
the endpoint and saves the cookie to `e2e/.auth/user.json`
(gitignored), which every test then loads via `storageState` — tests
start signed in without repeating the request.

## Fixtures and shared flows

Specs import `test` and `expect` from `e2e/fixtures.ts` instead of
`@playwright/test`. The base test is extended with signed in users:

- `user` — the storage-state user from the setup project above.
- `userA` / `userB` — users created fresh for the test through
  `POST /e2e/auth`, each in a browser context of their own. Multi-user
  scenarios (sharing, live collaboration, revocation) put both into the
  same document without them sharing cookies, and a fresh user keeps
  sidebar assertions independent of documents left behind by earlier
  runs.

Each of them is an `AppUser` wrapping the flows the specs share:
creating and opening documents, typing, toggling sharing, finding a
document in the sidebar. The flows also carry the synchronisation that
keeps the live-server tests stable — `createDocument`/`openDocument`
wait for the websocket to deliver the server-seeded heading before
anyone types, and toggling sharing waits for the share action's round
trip before the link is handed to the other user (or their access is
expected to be gone).

## The Creem checkout

`e2e/subscription.spec.ts` drives Creem's real test-mode checkout:
upgrade, pay with the always-succeeding test card on their hosted
page, follow the signed redirect back, see pro switched on and the
customer portal open. That buys real end-to-end confidence at the
price of depending on Creem being up and their checkout page keeping
its shape — the card-form locators in the spec are the one place to
adjust when it changes.

The paid spec needs `CREEM_API_KEY` (the playwright config loads
`.env`, so the same entry serves the dev server and the tests) and
skips itself without one — CI provides it as a repository secret to
the e2e job. Every run leaves a throwaway customer and subscription
behind in the test store. Webhook lifecycle behaviour (cancellations,
failed renewals, redeliveries) is deliberately not covered here —
Creem cannot deliver webhooks to localhost or a CI runner — and lives
in the service tests instead; see `docs/subscriptions.md`.

Subscription state sticks to the user, so these specs use the fresh
`userA` fixture, never the shared storage-state `user`.
