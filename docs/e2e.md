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
Playwright starts its own against the same Postgres/Redis service
containers as local dev.

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
