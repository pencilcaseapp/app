# Emails

We build transactional emails as React components with
[React Email](https://react.email/), render them to HTML on the server, and send
them through Lettermint.

`sendEmail` skips Lettermint when no API token is configured, and for test
addresses — `e2e-…` users the e2e tests sign up and the reserved
example/test domains (`isTestEmailAddress` in `app/services/email.ts`) —
so test runs against a configured token never spam the provider.

Everything — the components, `render()`, and the preview CLI — comes from the
single `react-email` package. It is a runtime dependency, not a dev one, because
the server renders templates with it. Do not reach for `@react-email/components`
or the individual `@react-email/<component>` packages: React Email v6 folded them
into `react-email` and npm now warns that they are deprecated.

## The e-mail log

Every send goes through `sendEmail`, and every send writes a row to
`email_logs` — there is no second path to Lettermint. The row is keyed by the
idempotency key of that e-mail, which is what stops the same e-mail going out
twice.

The key is `<template>:<scope>`, built by `emailIdempotencyKey` in
`app/constants/email.ts`. The template half comes from the `EmailTemplate`
enum, so two templates can never collide on the same scope; the scope half is
the id of whatever caused the send:

| Template | Scope | Why |
| --- | --- | --- |
| `otp-code` | the `otps` row id | A code the user asked for again is a new row, so it sends; a retry of the same code does not. |
| `email-change-code` | the `email_change_requests` row id | Same shape as the OTP. |
| `subscription-started` | the Creem subscription id | Happens once in the life of a subscription. |
| `subscription-canceled` | the Creem subscription id | Same. |
| `subscription-payment-failed` | the subscription id and the start of the billing period | Creem retries a failed payment several times inside one period and sends `subscription.past_due` for each attempt. One warning per period is what the user wants. |
| `document-invite` | the id of the invite | An invite sent again is another invite, so it goes out; a retried send of the same one does not. |

`current_period_start_date` is nullable on Creem's side, so the payment-failed
scope falls back to the Creem event id. That dedupes redeliveries of that one
event and nothing more, which is the right way round to be wrong: a second
warning is noise, a warning that never arrives is a lost customer.

The invite scope is the one that is not an id we already had. An invite is
not a code: the link in it is the access, and it does not expire, so a
second copy of the same invite is noise. But an invite that never arrives
costs a collaborator, so a re-invite the owner deliberately sent has to
send — which is why the scope is the invite and not the pair of document
and address. `sendEmailDocumentInvite` therefore takes an `inviteId`, and
whatever records invites owns what that is, exactly as the `otps` row id
is what lets a resent code through.

`sendEmail` claims the key in one statement before it calls the provider
(`claimEmailLog`), so two processes racing on the same key cannot both send.
A claim that comes back empty means the key is taken and the send is dropped.
The same key also goes to Lettermint through `idempotencyKey()`, which covers
the gap the table cannot: a request that reached them but whose answer we never
recorded.

A row ends up in one of four states. `sent` carries Lettermint's
`provider_message_id`; `skipped` records the sends we deliberately do not make
(no API token, a test address) so the log stays a complete account of what the
app decided; `failed` carries the error. **`failed` is the only state a key can
be claimed out of** — a send that never reached the provider has to be
retryable, everything else is final.

There is no clean-up job for the table, unlike `otps` and
`email_change_requests`. Deleting a row frees its key, and the subscription
scopes are keyed to things that live as long as the account does — dropping a
`subscription-started` row two years on would let that e-mail go out a second
time. If the table ever needs trimming, trim it by template rather than by age
alone: the code scopes are safe to delete once their own row is gone, the
subscription ones are not.

## Delivery tracking

Lettermint can push `message.delivered`, `message.hard_bounced`,
`message.spam_complaint` and friends to a webhook. We do not consume them, on
purpose.

Nothing in the app would act on a delivery event today. The log exists to stop
duplicates, and it answers "did we send this" from the row it already has —
"did it arrive" is a different question that no code path currently asks. A
webhook is not free either: a route, signature verification, an event table for
redeliveries the way `creem_webhook_events` works, and a provider whose events
arrive out of order. That is the Creem webhook's worth of machinery for a column
nobody reads.

The two things that would change the answer:

- **Suppressing sends to addresses that bounce.** The address is the only
  credential here, so an account whose mailbox hard-bounces cannot sign in at
  all. Knowing that would let the sign-in screen say so instead of showing "code
  sent" forever. Lettermint keeps its own suppression list, so the first version
  of this is a read of their API, not a webhook.
- **Support wanting to answer "did my code arrive".** Lettermint's dashboard
  answers it today, and `messages.events(messageId)` answers it on demand for
  any row in the log.

We paid the one cost that makes either cheap later: `email_logs` stores
`provider_message_id`, which is the join key an event would need. Adding the
webhook is then a route plus a status column, not a migration of everything
sent before it.

## Layout

```
app/emails/
  theme.ts                 the @theme block the templates are styled with
  theme.test.ts            fails when it drifts from app/app.css
  templates/               one template per file, default export
    otp-code.tsx
    otp-code.test.tsx
  testing.tsx              renderEmail(), for component snapshots
  ui/                      shared email UI, one directory per component
    layout/
    logo/
    typography/
    one-time-code/
public/emails/             images the templates link to
```

The layering carries on from the rest of the app: `app/routes/` and
`app/layouts/` → `app/services/` → `app/emails/`. A route never renders a
template. `app/services/email-templates.tsx` picks the template and the subject,
and `app/services/email.ts` renders it and hands it to Lettermint.

`app/emails/ui/` is to emails what `app/ui/` is to the app: presentational, no
data access. It sits outside `templates/` because that is the only directory the
preview server reads, so a component is never mistaken for a template.

## Previewing

```bash
npm run email      # React Email preview on http://localhost:3001
```

The preview renders each template with its `PreviewProps`, and has tabs for the
HTML source and the plain text alternative. It is also where the mail client
compatibility warnings show up.

There are no Storybook stories for email components. A template renders a whole
`<html>` document, so the preview server is the better tool, and keeping one
source of truth avoids two sets of fixtures drifting apart.

## Testing

Email components are snapshotted like the ones in `app/ui/`, but the snapshot
buys something extra here: what it records is the *inlined* CSS, so it pins the
whole Tailwind pipeline — theme tokens, `pixelBasedPreset`, and whatever the
current React Email version emits. A version bump that quietly moves padding
onto a different element or swaps `24px` back to `1.5rem` shows up as a diff
instead of as a broken email.

Render components through `renderEmail()` from `app/emails/testing.tsx`, which
wraps them in the same `<Tailwind>` provider `Layout` uses — without it the
classes stay as class names, which no mail client will read. Templates already
carry their own provider through `Layout`, so they go through `render()`
directly.

Each template gets two snapshots: the prettified HTML, and the plain text body.
The plain text one is short enough to read at a glance, which makes it the place
a reviewer will actually notice copy changes — including the ones that would
break iOS code detection.

Snapshots do not replace the behavioural assertions. Things like "the code is
one unbroken run of digits" or "nothing else in the copy is code-shaped" are
rules, and a snapshot only records that today's output happens to satisfy them.
Update snapshots with `npx vitest run -u` and read the diff.

## Styling

Templates are styled with Tailwind classes, the same `pca-*` vocabulary as the
rest of the app. `Layout` wraps every template in React Email's `<Tailwind>`,
which compiles the classes at render time and inlines them as `style`
attributes, because mail clients strip `<style>` blocks and class names.

Two things are handed to it:

- `theme` — the `@theme` block from `app/emails/theme.ts`. Tailwind v4 takes its
  tokens as CSS, which is what lets the emails use the real `pca-*` palette
  rather than a translation of it.
- `config={pixelBasedPreset}` — **required.** Without it every size comes out in
  `rem`, which Outlook renders unpredictably and which is relative to a root font
  size we do not control. `otp-code.test.tsx` fails if `rem` reaches the output.

Sizes come from named tokens — `text-heading-2`, `max-w-email`, `px-gutter` —
rather than arbitrary values, and that is not only cosmetic. `pixelBasedPreset`
only covers Tailwind's classic scale, so anything off it falls back to
`calc(var(--spacing) * n)` and lands in `rem`. **Ignore your editor when it
offers to rewrite `max-w-[296px]` as `max-w-74`**: the two are equivalent on the
web but not here, where the second renders `18.5rem`. The same trap catches
`px-4.5`, `pb-21.5` and `leading-7.25`. A named token keeps the pixels and drops
the warning, which is why the type scale in `theme.ts` names every Figma text
style instead of leaning on `text-2xl` plus a `leading-[…]` override.

`theme.ts` still has to repeat the palette, because there is no way to hand
`app/app.css` to both Tailwind pipelines: the app's runs through Vite, the
emails' runs inside `render()`. `theme.test.ts` parses both files and fails when
the two disagree, so the copy cannot drift silently. The font stack is
deliberately *not* mirrored — `--font-inter` swaps `ui-sans-serif`/`system-ui`
for `-apple-system` and friends, which is what mail clients understand.

Unlike the app's components, email components take a single `textColor` instead
of a `colorLight`/`colorDark` pair, and skip the exhaustive class lookup the web
`Typography` needs: nothing statically extracts these class names, so
`text-pca-${textColor}` is safe here.

Layout goes through the React Email primitives (`Container`, `Section`, `Row`,
`Column`) rather than hand-written `<table>`s. They emit the table markup Outlook
needs, and put padding on the cell rather than the table, where Outlook honours
it.

## Images

Gmail drops inline SVG, so the design system's SVG components cannot be reused
in an email. Rasterise to a 2x PNG, commit it under `public/emails/`, and link it
with an absolute URL built from `assetsUrl` in `theme.ts`.

That URL always points at production — at the host that actually serves these
files, which is the docs domain and not the app one: `pencilcase.app/emails/…`
answers with a 404. The recipient's mail client is what
fetches the image, so a localhost URL would never resolve — not even for an
email triggered from a dev machine.

Give the PNG a solid background rather than transparency. A black-on-transparent
mark disappears in clients that force their own dark background behind it.

## Dark mode

Email components do not follow the app's `colorLight`/`colorDark` convention.
`Layout` sets `color-scheme: light` and `supported-color-schemes: light`, which
asks iOS and Apple Mail not to invert the palette. Every colour is therefore a
single value, and templates should keep declaring explicit backgrounds so the
clients that ignore those metas still land somewhere sane.

## Adding a template

0. Add the template to the `EmailTemplate` enum in `app/constants/email.ts`
   and decide what its idempotency scope is — see **The e-mail log** above.
1. Add `app/emails/templates/<name>.tsx`. Compose it from `ui/`, wrap it in
   `Layout`, and export the component **and** a default export — the preview
   server needs the default.
2. Set `PreviewProps` on it so the preview has something to render.
3. Export a `<name>EmailSubject()` helper from the same file if the subject
   depends on the payload. Keeping it next to the copy means the two are
   reviewed together.
4. Add a `sendEmail<Name>()` function to `app/services/email-templates.tsx`.
   It takes whatever the scope is built from and hands `sendEmail` the
   `template` and the `idempotencyScope`.
5. Test it with `render()` from `react-email`: assertions for the behaviour that
   matters, plus the two snapshots described below.

## One-time codes and the iOS keyboard

iOS and macOS offer a one-time code to the keyboard and to AutoFill when they can
find one in the message. The detection is a heuristic, and the rules below are
what Apple documents for SMS plus what holds up in Mail.
`app/emails/templates/otp-code.tsx` follows all of them, so treat its copy as
load bearing.

- **Keep the code one unbroken run of characters.** A `<span>` per digit, a
  table cell per digit, or spaces, dashes, or thin spaces between the digits all
  stop detection dead. If a design wants the digits spread out, use
  `letter-spacing`, never characters. `OneTimeCode` exists to make this the
  default.
- **Put a keyword next to it.** "code", "verification code", "passcode",
  "one-time code", "PIN", "OTP". `Verification Code:` sits directly above the
  digits, and the sentence above uses "code" twice more.
- **Keep it 4–8 digits.** Ours are six, from `randomInt(100000, 1000000)` in
  `app/services/auth.ts`.
- **Never wrap the code in a link.** It then reads as a URL rather than a code.
- **Do not let a second code-shaped number into the copy.** Anything with four
  to eight digits — a year, an order number, a price — is a candidate iOS might
  pick instead. "expires after 15 minutes" is safe because two digits are too
  short to qualify. `otp-code.test.tsx` guards this.
- **Carry the code in the subject line.** That is what lets iOS offer it from
  the notification without the message being opened. `otpCodeEmailSubject()`
  does it, and keeps the subject to just that — the sender name already says
  "pencil case", so repeating the brand there only pushes the code out of the
  truncated line. The preheader deliberately does *not* repeat the code: it sits
  right under the subject in the inbox, where a second copy of the digits reads
  as noise, so it carries the expiry instead. The code still reaches the body
  under its `Verification Code:` label, which is the placement detection needs.
- **Always send the plain text alternative.** It is the part some clients read,
  and it has to satisfy the same rules. `sendEmail()` renders it from the same
  component, so there is nothing to keep in sync.
- **Do not add the `@example.com #123456` line.** Domain-bound codes are an SMS
  mechanism; in an email the line does nothing and shows up as noise.

On the receiving end the input needs `autocomplete="one-time-code"`.
`app/ui/one-time-password-field` already sets it.

## Inviting somebody to a document

`document-invite` is the e-mail behind sharing a document by address, a
feature of the paid plan. The invite is a `document_collaborators` row
with the address and the access the owner chose (`app/services/
document-invite.ts`), and the e-mail's idempotency scope is that row's
id. There is no invite screen: the link in the e-mail is the document
URL, and opening it while signed in with the invited address is what
accepting means — `openDocument` (`app/services/document.ts`) finds the
pending invite by the address and ties it to the account, so the document
appears in their navigation from then on and the "Invited" badge in the
share panel goes.

The copy asks the recipient to sign in with the address the invite was
sent to, and says a code goes to that same mailbox — the whole sign-in is
one click from the e-mail they are already reading. Three things follow:

- **Signing in with the invited address is what gets them in.** A private
  document sends a signed-out visitor to sign in (`app/routes/doc.tsx`,
  the `PermissionDenied` branch), and a signed-in one is matched against
  the invite by their address. Only when the link is on as well does the
  document open without signing in — as it does for anybody with the
  link.
- **What the recipient may do is what the owner set for them**, which the
  e-mail deliberately does not spell out: the owner can change it a
  minute later from the share panel, and the change reaches them live.
  Removing their access deletes the invite, so inviting the address again
  is a new invite and a new e-mail.
- **The document does not have to be shared.** An invite is the private
  way in; the link is the public one, and turning it off leaves the
  invited people where they are.

The subject names the sharer and the document — `Alex shared "Trip to the
Alps" with you` — because an invite is recognised by who sent it, and an
unrecognised one gets deleted. A document with no heading yet has no title,
so both the subject and the body fall back to `Untitled`, the same word the
navigation shows.
