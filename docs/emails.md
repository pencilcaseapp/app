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
  theme.ts                 email design tokens
  otp-code.tsx             one template per file, default export
  otp-code.test.tsx
  _components/             shared email UI, one directory per component
    email-layout/
    email-logo/
    email-heading/
    email-text/
    email-code/
public/emails/             images the templates link to
```

The layering carries on from the rest of the app: `app/routes/` and
`app/layouts/` → `app/services/` → `app/emails/`. A route never renders a
template. `app/services/email-templates.tsx` picks the template and the subject,
and `app/services/email.ts` renders it and hands it to Lettermint.

`app/emails/` is also the directory the React Email preview server reads, which
is why the shared components sit under `_components/`: the preview lists every
`.tsx` in the tree that has a default export, and skips directories whose name
starts with `_`. Tests are safe to keep next to their template — they have no
default export, so the preview ignores them.

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

## Styling

Mail clients strip `<style>` blocks and class names, so every rule has to end up
in a `style` attribute. That rules out the Tailwind `pca-*` tokens — they only
exist as CSS custom properties in `app/app.css`, which never reaches an inbox.
`app/emails/theme.ts` mirrors the values we need by hand; **change it whenever
the `@theme` block changes.**

We deliberately do not use React Email's `<Tailwind>` component. Adopting it
would mean handing it a config that repeats the theme in a form it understands —
the same duplication as `theme.ts`, with a build step on top and a second
Tailwind pipeline in the request path.

Layout goes through the React Email primitives (`Container`, `Section`, `Row`,
`Column`) rather than hand-written `<table>`s. They emit the table markup Outlook
needs.

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
`EmailLayout` sets `color-scheme: light` and `supported-color-schemes: light`,
which asks iOS and Apple Mail not to invert the palette. Every colour is
therefore a single value, and templates should keep declaring explicit
backgrounds so the clients that ignore those metas still land somewhere sane.

## Adding a template

1. Add `app/emails/<name>.tsx`. Compose it from `_components/`, wrap it in
   `EmailLayout`, and export the component **and** a default export — the
   preview server needs the default.
2. Set `PreviewProps` on it so the preview has something to render.
3. Export a `<name>EmailSubject()` helper from the same file if the subject
   depends on the payload. Keeping it next to the copy means the two are
   reviewed together.
4. Add a `sendEmail<Name>()` function to `app/services/email-templates.tsx`.
5. Test the template directly with `render()` from `react-email` rather than
   snapshotting the markup — the assertions stay about behaviour instead of
   breaking on every spacing change.

## One-time codes and the iOS keyboard

iOS and macOS offer a one-time code to the keyboard and to AutoFill when they can
find one in the message. The detection is a heuristic, and the rules below are
what Apple documents for SMS plus what holds up in Mail. `app/emails/otp-code.tsx`
follows all of them, so treat its copy as load bearing.

- **Keep the code one unbroken run of characters.** A `<span>` per digit, a
  table cell per digit, or spaces, dashes, or thin spaces between the digits all
  stop detection dead. If a design wants the digits spread out, use
  `letter-spacing`, never characters. `EmailCode` exists to make this the
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
