# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Principles

- **Simplicity over complexity.** We are a small team and everyone has to
  maintain and understand this code. Favour the readable, obvious solution
  over the clever one.
- **Thin loaders and actions.** Loaders and actions control the route and
  nothing more. Push business logic into `app/services/` and data access into
  `app/repos/` (see **Layering** below).
- **Few comments.** Let the code explain itself; only comment genuinely
  complex business logic.
- **Pull requests and commits.** Follow the `pull-request` skill
  (`.claude/skills/pull-request/`) — Angular commit format and short,
  human-readable PR descriptions.

## Commands

```bash
npm run docker:up      # start dev (:5433) and test (:5434) Postgres containers
npm run dev            # dev server on http://localhost:3000 (runs migrations on boot)
npm run test           # vitest (watch mode); requires the test Postgres on :5434
npm run e2e            # Playwright e2e tests; needs the dev Postgres/Redis (docs/e2e.md)
npm run typecheck      # react-router typegen && tsc
npm run lint           # eslint
npm run storybook      # Storybook on :6006
npm run email          # React Email preview of app/emails on :3001
npm run build          # react-router build + esbuild bundle of server.ts -> server.js
```

Run a single test file or test name:

```bash
npx vitest run app/repos/document.test.ts -t 'creates an empty document'
```

Generate a migration after editing `app/db/schema.ts` (drizzle-kit is not wired to an npm script):

```bash
npx drizzle-kit generate
```

Migrations live in `drizzle/` and are applied automatically at server start
(`app/db/migrate.ts`) and before the test suite (`test/global-setup.ts`, which
drops and recreates the whole test schema first).

`.claude/launch.json` defines the `dev` (:3000) and `storybook` (:6006) servers,
so they can be started and previewed in a browser without a manual shell.

**Claude Code on the web.** The cloud container ships the Docker binaries but
starts no daemon, so `npm run docker:up` — and with it every test and e2e run —
fails there until something starts one. `.claude/hooks/session-start.sh` is a
`SessionStart` hook (registered in `.claude/settings.json`) that starts
`dockerd`, runs `npm install` and brings the compose stack up. It exits
immediately unless `CLAUDE_CODE_REMOTE` is `true`, so local dev is untouched.
Docker Hub rate limits anonymous pulls per IP and the cloud environment shares
its egress address, so the hook points the daemon at Google's pull-through
mirror in `/etc/docker/daemon.json`; without it `postgres:18` and
`redis:8-alpine` come back as `429 Too Many Requests`. If Docker looks broken
mid-session, re-run the hook rather than starting `dockerd` by hand —
`/var/log/dockerd.log` has the daemon output. The cloud container also
ships its own Chromium instead of the Playwright-pinned build, so run
the e2e tests there with
`PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run e2e`
(the config picks the path up; everywhere else it stays unset). For the
specs that leave localhost (the Creem checkout), additionally set
`PLAYWRIGHT_CHROMIUM_PROXY=$HTTPS_PROXY` — the browser has to go
through the container's egress proxy, and the config's proxy arguments
also cap TLS at 1.2 because the relay cannot digest Chromium's TLS 1.3
client hello.

CI (`.github/workflows/ci.yml`) runs lint, test, e2e, typecheck, build, and
build-storybook; the test and e2e jobs start their databases with the same
`npm run docker:up` as local dev. Pushing to `main` deploys to production via
`.github/workflows/cd.yml`.

## Architecture

React Router 7 (framework mode, SSR) on a custom Express server, Postgres via
Drizzle ORM, real-time collaborative editing with Lexical + Yjs + Hocuspocus.

**Server entry — `server.ts`.** One `node:http` server hosts both the React
Router request handler and the WebSocket upgrade. In prod it serves the built
client and attaches `createLiveServer`; in dev it runs Vite in middleware mode
and lazily `ssrLoadModule`s `app/live/index.ts` on upgrade so the live server
hot-reloads too. Not run through Vite's own dev server — start it with
`npm run dev`, not `vite`.

**Config — `app/config/`.** `getConfig()` switches on `process.env.ENV`
(`development` | `test` | `prod`, defaulting to test) and returns a fully typed
`Config`. DB URLs, secrets, ports, and cookie flags all come from here; do not
read `process.env` directly outside `app/config/`. Dev and test point at the two
different Docker Postgres ports.

**Collaboration — `app/live/index.ts`.** A Hocuspocus server behind a `crossws`
adapter. Its `Database` extension is the persistence bridge: `fetch` loads
`documents.content` (a `bytea` Yjs update) or seeds a fresh doc via
`createInitialDocumentContent()`, and `store` writes the Yjs state back along
with a title extracted from the Y.Doc (`extractTitleFromYDoc`). The document
title is therefore derived from the first heading of the editor content, not
edited directly — client side the same extraction runs through
`useExtractDocumentTitle` and the `DocumentTitleProvider` context so the sidebar
and `<title>` stay live. The store sits behind Hocuspocus' debounce while the
sidebar loader re-runs on every navigation, so the list would show a document
retitled a moment ago with its old title as soon as another one is opened:
`useLiveTitles` (`app/hooks/use-live-titles.ts`) keeps the title the editor
reported for a document until the loader lists a label other than the one it
listed when the title was reported. `app/utils/headless.ts` uses a headless
Lexical editor to produce valid Yjs updates on the server.

**Scaling out — `app/live/redis.ts`, `docs/scaling.md`.** A Y.Doc lives in the
process that loaded it, so every instance past the first needs
`@hocuspocus/extension-redis` to fan updates and awareness out to the others,
answer a cold load with a peer's in-memory state, and lock the document before
the `Database` extension writes it. It is a transport, not a store — Postgres
stays the only persistence. `config.live.redis` is optional and leaving it out
(the test environment) runs the live server on its own. `config.instanceId` is what
the extension tags its messages with to filter its own back out, so it has to
be unique per process. `stopLiveServer` drains on `SIGTERM`: a deployment would
otherwise drop everything still sitting behind the store debounce. Read
`docs/scaling.md` before touching any of this — it covers what a managed Redis
has to support (Pub/Sub and `EVAL`, which several Redis-compatible stores skip)
and why sticky sessions stay off.

**Background jobs — `app/jobs/`, `docs/jobs.md`.** BullMQ on the same Redis
server as the live fan-out, under its own config (`config.jobs.redis`) and
key prefix (`pencil-case:jobs`). A job is a `JobDefinition` (unique name,
UTC cron `schedule`, `run`) in `app/jobs/definitions/`, registered in
`app/jobs/definitions/index.ts`; `server.ts` calls `startJobs()` on boot,
which upserts the schedulers and starts the worker in-process, and
`stopJobs()` on `SIGTERM` so a running job finishes before the instance
goes away. Leaving `jobs.redis` out of the config (test) disables jobs;
tests call `run` directly. Bull Board is mounted at `/dev/bullmq` in
development only. Keep `run` idempotent — the queue retries three times
with backoff.

**Live authorisation — `app/live/connections.ts`.** The upgrade request never
passes through the route middleware, so `onConnect` resolves the session from
the cookie itself (`getAuthUserByCookie`) and asks `getLiveAccess`; throwing
there rejects that one document, not the whole socket, which is shared between
all documents a client has open. Unsharing calls `closeDocumentConnections`,
which closes the live connections of everybody but the owner, so access is
revoked immediately instead of at the next request. The client turns that into
the permission denied screen via `useAccessRevoked` → `revalidate()`; the
hook also drops the provider from the shared socket right there, without
the close `detach` would send, because the server queues a close for a
connection it no longer has as the first message of the next connection to
that document — and closes that one with it. The two
sides find each other through `globalThis`: `server.ts` and the routes are
separate bundles in prod, so importing the instance would give each of them
their own. Closing is per process, and the Redis extension does not propagate
it, so `registerRevocationChannel` publishes the revocation on its own channel
and every instance closes the connections it holds; the publisher closes its
own straight away, and the echo of its own message is a no-op.

**Subscriptions — `app/services/subscription.ts`, `docs/subscriptions.md`.**
The pro subscription is sold through Creem (merchant of record): the
subscription section of the settings dialog
(`/doc/:id/settings/subscription`) shows the upgrade offer or the
running subscription; its action starts their hosted checkout with
the section's own URL as the success URL and its loader verifies the
signed redirect Creem comes back with, `/upgrade` redirects into the
section over the latest document (emails link there),
`/webhooks/creem` keeps the `subscriptions` table in sync (events
recorded in `creem_webhook_events` for idempotency), and
`/billing-portal` opens Creem's self-service portal. Access control is
only ever `users.has_subscription`, recomputed from the stored statuses
on every sync. `app/services/creem.ts` wraps the official `creem` SDK;
`config.creem` switches between test and live mode. The e2e tests
drive Creem's real test-mode checkout and skip without
`CREEM_API_KEY`. Read
`docs/subscriptions.md` before touching webhook handling or the emails
around it — it also spells out which emails Creem sends for us.

**Auth.** Passwordless magic code. `app/services/auth.ts` owns the flow
(argon2-hashed OTP → cookie session with a sha256-hashed token stored in
`sessions`); `app/repos/` holds the raw queries. Two React Router middlewares in
`app/middleware/auth.ts`: `sessionMiddleware` (registered globally in
`app/root.tsx`) populates `optionalUserSessionContext` and, when a session was
refreshed, a `set-cookie` header context that `root.tsx`'s loader commits;
`authMiddleware` is opted into per route and redirects to `/signin?returnUrl=…`,
setting the non-optional `userSessionContext`. Loaders read the user from
`context.get(...)`, never by re-parsing the request.

**Changing the e-mail — `app/services/email-change.ts`.** The address is
the only credential, so it changes through a verified two-step flow
stacked on the account section (`/doc/:id/settings/account/email`, then
`…/email/:requestId`): `initEmailChange` refuses the current address and
one another account has, rate limits on `email_change_requests` by user
*and* by canonical target mailbox (three per fifteen minutes, so no
account can flood an address), expires the user's earlier requests and
sends the code to the new address; `verifyEmailChange` only accepts a
request of the session's user, burns attempts like the sign-in OTP (five,
then the request expires), checks the address is still free and only then
writes `users.email`; the route then calls `signOutOtherSessions`, so
whoever could sign in through the old mailbox loses their sessions while
the one doing the change keeps theirs. Requests expire after fifteen minutes and the
`clean-up-expired-email-change-requests` job deletes them a day later,
like the OTPs. The success toast travels back to the account section
through `SearchParamToast`.

**Emails — `app/emails/`.** Transactional emails are React Email components.
`app/services/email-templates.tsx` picks the template and subject,
`app/services/email.ts` renders it to HTML *and* plain text and hands both to
Lettermint. `app/emails/templates/` holds one template per file (the only
directory the preview server reads) and `app/emails/ui/` the shared email UI.
Every send is logged in `email_logs` and claimed by an idempotency key first
(`<template>:<scope>` from `app/constants/email.ts`), so the same e-mail never
goes out twice; the key also rides along to Lettermint. Delivery events are
deliberately not consumed — `docs/emails.md` has the scopes, the states a log
row moves through, and why there is no Lettermint webhook.
Templates are styled with the same `pca-*` Tailwind classes as the app:
`Layout` wraps them in `<Tailwind>` with the `@theme` block from
`app/emails/theme.ts`, which repeats the palette because the two Tailwind
pipelines cannot share `app/app.css` — `theme.test.ts` fails when they drift.
`pixelBasedPreset` is not optional; without it sizes render in `rem`. Preview
with `npm run email`. Email components snapshot the *inlined* CSS through
`renderEmail` (`app/emails/testing.tsx`), which is what pins the Tailwind
pipeline across React Email upgrades. The OTP template's copy is load bearing
for iOS one-time-code detection — read `docs/emails.md` before rewording it.

**Presence — `app/utils/presence.ts`.** The avatars next to the Share button
are the other people in the document, read from the Yjs awareness the
Hocuspocus server broadcasts on every join and drops on every leave
(`useCollaborators`). Lexical writes `name` and `color` into awareness for its
remote cursors, so identity is handed to `CollaborationPlugin` as
`username`/`cursorColor` and read back out of awareness — one source for both
the cursors and the avatars. A signed in user gets their name (or their email
when they have none) and a colour hashed from their user id; a signed out
visitor gets a name from `ANONYMOUS_NAMES` hashed from a guest id kept in
`localStorage` (`app/utils/guest-id.ts`), which is what makes both stable
across rejoins. That same id rides along in awareness as `awarenessData`
(`PresenceAwarenessData`), which Lexical preserves through its own updates, so
the list holds one entry per person rather than per connection: the local
connection is dropped by client id and the remaining ones are deduplicated by
presence id, which keeps your own second tab out without merging two guests who
happened to draw the same animal. Pass that object to `CollaborationPlugin` as
a stable reference — it is one of the plugin's effect dependencies.
`awarenessData` also carries `isActive`, which is what keeps the avatars from
standing for an open socket: awareness has a heartbeat of its own (a state
not renewed within 30 seconds is dropped), but a tab left behind another one
keeps sending it, so a ping cannot tell the two apart. `usePresenceActivity`
(`app/hooks/use-presence-activity.ts`) therefore publishes what the browser
knows through the Page Visibility API — whether the document is the page in
front of the person — and `getRemoteCollaborators` leaves out the connections
that say it is not: the list is the people on the document, not the tabs
pointed at it. A tab that goes to the background is held for
`PRESENCE_HIDDEN_GRACE_MS` before it drops, so checking another tab and coming
back does not blink somebody out of everybody else's avatars, while the tab
left open behind an inbox runs the grace out. Visibility is deliberately the
only signal: it says the tab is in front, not that somebody is in front of the
tab, so a laptop left open on a document still counts as present until it is
put to sleep. Interaction (a pointer or a keystroke) is what would close that
gap, at the price of dropping whoever reads without touching anything. It writes into
the same `awarenessData` object rather than a new one, because Lexical
rewrites that field from its prop on every cursor update and would drop a
replacement; `setAwarenessField` is only there to broadcast the change in
between. Somebody with a second tab stays listed for as long as one of them is
in front of them, and a connection that does not report activity at all counts
as there. Colours come from `PRESENCE_COLORS`, all of which clear 4.5:1
against the white initial and 3:1 against either page background. Awareness is written by the other
clients, so `getRemoteCollaborators` treats it as untrusted input: names are
clamped to `MAX_PRESENCE_NAME_LENGTH` (Lexical draws the cursor label
`nowrap`, so an unbounded one stripes across the document) and anything
outside the palette falls back to a hashed colour. That bounds the damage to
misrepresenting yourself; a name is still free text, which only server-side
identity would fix. The look of the remote cursors is Lexical's own
`theme.collaboration` (`app/ui/editor/editor-theme.ts` → the
`editor-collab-*` rules in `editor.css`), which hands each element the
person's colour as `--lexical-cursor-color` and leaves the positioning to the
plugin. The selections are drawn as CSS Custom Highlights rather than one
span per line rect — the rect path drops lines it reads as spanning the whole
editor — which the plugin asks for per cursor the first time it draws it.
It redraws from two places, so both have to opt in: the `selectionHighlight`
prop covers awareness updates and `syncCursorPositionsFn` covers Yjs document
changes; drop either and a cursor first drawn by that path keeps the rect
rendering for good. The one thing the plugin does not do is keep a name tag on
screen, so
`useCursorNameBounds` measures the tags it drew and nudges them sideways with
a `transform` — the only property those rules leave alone.

**Deletion — `app/services/document.ts`.** Documents are soft deleted:
`deleteDocument` stamps `documents.deleted_at` and turns sharing off in the
same owner-scoped update (`softDeleteDocument`), then drops the
collaborators and closes every live connection, so the document vanishes
for everybody else at once. A deleted document is not found for anyone but
its owner, who can still open it read-only: `openDocument` reports it as
`deleted`, the doc route then shows a notice above the content and drops
the share panel, and `getLiveAccess` hands the live server a read-only
connection (Hocuspocus drops that connection's own updates). Deleting or
restoring changes the editor's `key`, so it reconnects with the new access,
and both close the document's connections server side, which
`useAccessRevoked` answers by letting go of the provider on the spot (see
its comment for why the unmount must not send a close of its own).
`restoreDocument` clears the stamp but leaves sharing off — the owner shares
again on purpose, and `setDocumentShared` refuses a deleted document.
Neither delete nor restore touches `updatedAt`, and neither does sharing or
unsharing: nothing was edited, so a restored document lands back where it
was in the navigation and sharing one leaves it where it is. The sidebar
posts to the resource routes `/doc/:id/delete` (from
`DeleteDocumentDialog`'s fetcher form) and `/doc/:id/restore` (the row
menu of the Deleted group, whose rows link to the read-only view). The
`purge-deleted-documents` job hard deletes rows past
`DELETED_DOCUMENT_RETENTION_DAYS` (`app/constants/document.ts`, also the
number the dialog and the notice quote) every night.

**Sidebar ordering — `app/layouts/editor.tsx`.** `getDocumentList` sorts by
`updatedAt`, and the live server bumps it on every persist, so the raw loader
order would reshuffle the navigation on each revalidation. `useStableOrder`
(`app/hooks/use-stable-order.ts`) therefore freezes the order for as long as the
layout stays mounted — items still come from the loader (titles stay fresh),
only their positions are remembered; an unseen item slots in below the item
the server lists above it, so a new document goes to the front and a restored
one returns to its place. Its
`moveToTop` applies a one-off move, which is how the document you start editing
catches up: `useFirstLocalEdit` reports the first Y.Doc update that does not
originate from the Hocuspocus provider, and `EditedDocumentProvider`
(`app/contexts/edited-document.tsx`) carries that from `routes/doc.tsx` up to
the sidebar, which renders below the same layout but outside its `<Outlet />`.

**Layering.** `app/routes/` and `app/layouts/` (loaders/actions) → `app/services/`
(business logic) → `app/repos/` (Drizzle queries, one module per table) →
`app/db/`. Repos validate UUIDs before querying and return `undefined`/`[]`
rather than throwing.

**Forms.** TanStack Form via `useAppForm` (`app/hooks/use-app-form.ts`), which
wires the field/form component registry (`ControlledTextField`, `Checkbox`,
`OneTimePasswordField`, `SubmitButton`) and merges server `actionData` back into
client state. Actions call `validateForm(request, zodSchema)` from
`app/utils/form.ts` — it enforces CSRF (throwing 403), runs the Zod schema
server-side, and derives `FormDataInfo` coercion hints from the schema shape.
Return `form.formState` on failure, or `returnFormError(...)` for
service-level errors. The same Zod schema is reused as the client `onBlur`
validator.

**UI.** `app/ui/` is the design system (presentational, has Storybook stories,
no data access); `app/components/` is app-specific composition. Tailwind v4 with
theme tokens defined in `@theme` in `app/app.css` — always use the `pca-*`
tokens (`bg-pca-grey-900`, `text-pca-white`, …), never raw Tailwind palette
colors. Components take explicit `colorLight`/`colorDark`, `textColorLight`/
`textColorDark` props and emit both light and `dark:` classes rather than
relying on a runtime theme. Polymorphism goes through the `as` prop and
`PolymorphicComponentPropWithRef`. A new component with real mechanics behind
it — an overlay, a menu, a form control with its own focus and keyboard
handling — is built on Base UI (`@base-ui/react`), which owns the behaviour
while `app/ui/` owns the look; the dialog, drawer, select, switch, meter and
toast already are. The `@radix-ui/*` packages still under the dropdown menu,
tooltip, separator, accordion and sidebar portal are what we reached for
before and are not the choice for anything new — leave them where they are
rather than migrating them.

**Animation.** Keyframes and their `--animate-*` tokens live in the `@theme`
block in `app/app.css` and are used through Tailwind (`animate-row-shift`,
`animate-accordion-down`, …); `motion/react` is reserved for animations that
need JS (the sidebar slide in `app/ui/sidebar/sidebar-menu.tsx`, presence).
Never leave `transition-all` on an element whose `transform` is animated by
Motion or by a keyframe — the CSS transition and the animation fight over the
property and the result reads as a bounce. Gate JS-driven motion on
`useReducedMotion()`. Sidebar stacking: the sidebar itself is `z-20`, the sticky
group header and the sticky bottom area are `z-10`. Above them the overlays
stack in a fixed order: topbar, dropdowns and the dialog and drawer layers at
`z-50`, tooltips at `z-60`, and the toast viewport at `z-70` so a toast stays
readable over a dialog's backdrop.

## Conventions

- `~/*` maps to `app/*`, `~/test/*` maps to `test/*`.
- Files and directories are kebab-case; a component lives in its own directory
  alongside its `.test.tsx`, `.stories.tsx`, and `__snapshots__/`.
- ESLint uses `@stylistic` customize (semicolons, single quotes, comma dangle)
  plus a hard **80-column max-len**. Run `npm run lint` before finishing.
- Route types come from `./+types/<route>`; run `npm run typecheck` (which runs
  `react-router typegen` first) after adding or renaming routes in
  `app/routes.ts`.
- Prefer `href('/doc/:id', { id })` over hand-written paths; search param keys
  live in `app/constants/search-params.ts` and shared copy in
  `app/constants/common-copies.ts`.

## Tests

Vitest with `happy-dom` and globals enabled. CSRF validation is stubbed globally
in `test/setup.ts`, which also cancels the timeouts a test leaves pending —
`input-otp` never clears its own, and one firing after happy-dom tore the window
down used to fail the run with `window is not defined` even though every test
passed.

- Repo/service tests hit the **real** test database. Build rows with the
  factories in `test/data-factories/` (faker-backed, they insert), not by hand.
- Route tests use `renderRoute(path, { params, context, searchParams })` from
  `app/utils/testing.tsx`, which resolves the module from `app/routes.ts`, wraps
  it in `createRoutesStub` plus the
  CSRF/document-title/edited-document/sidebar/socket-client providers, and
  strips middleware. Inject the session by setting
  `userSessionContext` on a `RouterContextProvider` and `vi.mock` the repos the
  route imports. A route that consumes a new context needs its provider added to
  that wrapper, otherwise every route test using it throws.
- Plain objects for non-DB assertions live in `test/fixtures/`.
- Many UI tests snapshot the **full** class string, so any change to a
  component's `className`s breaks one. Run `npx vitest run -u` and commit the
  updated `__snapshots__` as part of the change.
- Hooks are testable with `renderHook` from `@testing-library/react` (see
  `app/hooks/use-stable-order.test.ts`); anything depending on layout
  (`offsetTop`, `getBoundingClientRect`) is not — happy-dom reports zeroes, so
  verify that in Storybook instead.
- End-to-end tests are Playwright specs in `e2e/` against the dev server and
  its Postgres/Redis; they sign in through `POST /e2e/auth` (enabled by
  `config.e2e`, absent in prod) instead of the OTP flow. See `docs/e2e.md`.
