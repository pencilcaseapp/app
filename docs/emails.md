# Emails

We build transactional emails as React components with
[React Email](https://react.email/), render them to HTML on the server, and send
them through Lettermint.

Everything — the components, `render()`, and the preview CLI — comes from the
single `react-email` package. It is a runtime dependency, not a dev one, because
the server renders templates with it. Do not reach for `@react-email/components`
or the individual `@react-email/<component>` packages: React Email v6 folded them
into `react-email` and npm now warns that they are deprecated.

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

That URL always points at production. The recipient's mail client is what
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

1. Add `app/emails/templates/<name>.tsx`. Compose it from `ui/`, wrap it in
   `Layout`, and export the component **and** a default export — the preview
   server needs the default.
2. Set `PreviewProps` on it so the preview has something to render.
3. Export a `<name>EmailSubject()` helper from the same file if the subject
   depends on the payload. Keeping it next to the copy means the two are
   reviewed together.
4. Add a `sendEmail<Name>()` function to `app/services/email-templates.tsx`.
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
  does it, and the preheader repeats it so it is also the first text in the body.
- **Always send the plain text alternative.** It is the part some clients read,
  and it has to satisfy the same rules. `sendEmail()` renders it from the same
  component, so there is nothing to keep in sync.
- **Do not add the `@example.com #123456` line.** Domain-bound codes are an SMS
  mechanism; in an email the line does nothing and shows up as noise.

On the receiving end the input needs `autocomplete="one-time-code"`.
`app/ui/one-time-password-field` already sets it.
