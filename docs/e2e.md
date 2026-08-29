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

## The fake Creem

`e2e/subscription.spec.ts` covers the paid-subscription flow end to
end without leaving localhost: `playwright.config.ts` starts the dev
server with `CREEM_API_URL` pointing at `app/routes/e2e-creem.ts`, a
fake of the few Creem endpoints the app calls plus stand-in checkout
and portal pages. The fake signs its checkout redirects and webhook
deliveries with the same functions (and config values) the app
verifies with, so the signature checks run for real; `AppUser` gains
`upgradeToPro()` and `deliverCreemWebhook(...)` for driving it. Like
`/e2e/auth` it 404s unless `config.e2e` is set.

Subscription state sticks to the user, so these specs use the fresh
`userA` fixture, never the shared storage-state `user`. And because a
locally reused dev server keeps its own environment: start it with
`CREEM_API_URL=http://localhost:3000/e2e/creem npm run dev` (or let
Playwright start one) before running these specs, otherwise the
upgrade button walks into the real test-mode checkout.
See `docs/subscriptions.md` for the integration itself.
