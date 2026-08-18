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

CI (`.github/workflows/ci.yml`) runs lint, test, typecheck, build, and
build-storybook. Pushing to `main` deploys to Clever Cloud via
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
and `<title>` stay live. `app/utils/headless.ts` uses a headless Lexical editor
to produce valid Yjs updates on the server.

**Live authorisation — `app/live/connections.ts`.** The upgrade request never
passes through the route middleware, so `onConnect` resolves the session from
the cookie itself (`getAuthUserByCookie`) and asks `canOpenDocument`; throwing
there rejects that one document, not the whole socket, which is shared between
all documents a client has open. Unsharing calls `closeDocumentConnections`,
which closes the live connections of everybody but the owner, so access is
revoked immediately instead of at the next request. The client turns that into
the permission denied screen via `useAccessRevoked` → `revalidate()`. The two
sides find each other through `globalThis`: `server.ts` and the routes are
separate bundles in prod, so importing the instance would give each of them
their own. `closeConnections` is per process — scaling out needs
`@hocuspocus/extension-redis`.

**Auth.** Passwordless magic code. `app/services/auth.ts` owns the flow
(argon2-hashed OTP → cookie session with a sha256-hashed token stored in
`sessions`); `app/repos/` holds the raw queries. Two React Router middlewares in
`app/middleware/auth.ts`: `sessionMiddleware` (registered globally in
`app/root.tsx`) populates `optionalUserSessionContext` and, when a session was
refreshed, a `set-cookie` header context that `root.tsx`'s loader commits;
`authMiddleware` is opted into per route and redirects to `/signin?returnUrl=…`,
setting the non-optional `userSessionContext`. Loaders read the user from
`context.get(...)`, never by re-parsing the request.

**Emails — `app/emails/`.** Transactional emails are React Email components.
`app/services/email-templates.tsx` picks the template and subject,
`app/services/email.ts` renders it to HTML *and* plain text and hands both to
Lettermint. `app/emails/templates/` holds one template per file (the only
directory the preview server reads) and `app/emails/ui/` the shared email UI.
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
a stable reference — it is one of the plugin's effect dependencies. Colours
come from `PRESENCE_COLORS`, all of which clear 4.5:1 against the white initial
and 3:1 against either page background.

**Sidebar ordering — `app/layouts/editor.tsx`.** `getDocumentList` sorts by
`updatedAt`, and the live server bumps it on every persist, so the raw loader
order would reshuffle the navigation on each revalidation. `useStableOrder`
(`app/hooks/use-stable-order.ts`) therefore freezes the order for as long as the
layout stays mounted — items still come from the loader (titles stay fresh),
only their positions are remembered; unseen items go to the front. Its
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
`PolymorphicComponentPropWithRef`.

**Animation.** Keyframes and their `--animate-*` tokens live in the `@theme`
block in `app/app.css` and are used through Tailwind (`animate-row-shift`,
`animate-accordion-down`, …); `motion/react` is reserved for animations that
need JS (the sidebar slide in `app/ui/sidebar/sidebar-menu.tsx`, presence).
Never leave `transition-all` on an element whose `transform` is animated by
Motion or by a keyframe — the CSS transition and the animation fight over the
property and the result reads as a bounce. Gate JS-driven motion on
`useReducedMotion()`. Sidebar stacking: the sidebar itself is `z-20`, the sticky
group header and the sticky bottom area are `z-10`.

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
