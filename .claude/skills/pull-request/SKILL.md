---
name: pull-request
description: >-
  Open a pull request for this repo the way we like them: Angular-format
  commit messages and a short, human-readable description. Use when the
  user asks to create, open, or raise a PR, or to write a PR description or
  commit message.
---

# Pull request

How we write commits and pull requests in this repo. The goal is that a
teammate can read the title and description in a few seconds and know **what
changed and why**.

## Commit messages (Angular format)

```
<type>(<scope>): <subject>
```

- **type** — one of: `feat`, `fix`, `refa` (our shorthand for refactor),
  `docs`, `build`, `test`, `chore`, `perf`, `style`. Check `git log` and match
  the house style; `refa` is preferred over `refactor`.
- **scope** — optional, the area touched (`ui`, `sidebar`, `auth`,
  `doc`, `document-item`, …). Lowercase, kebab-case. Skip it when the change
  is broad.
- **subject** — imperative mood, lowercase, no trailing period, kept short.

Examples from our history:

```
feat(ui): copy link button
fix(sidebar): avoid resorting the navigation items
refa: require document owner
docs: add CLAUDE.md and fix dev server port in README
```

A body is optional and only worth adding when the *why* is not obvious from
the subject. Keep it to a couple of lines.

## Pull request description

Keep it **short and human-readable**. No ceremony, no filler headings, no
restating the diff line by line. A few sentences or bullets is usually enough.

Cover, in order:

1. **What changed** — one or two lines on the actual change.
2. **Why** — the reason or the problem it solves. Link the issue if there is
   one.
3. **Caveats** — call out anything a reviewer must know before merging:
   **breaking changes**, migrations, trade-offs taken, follow-ups deferred.
   Omit this section entirely when there is nothing to flag.

### Template

```md
<one or two lines: what this changes>

Why: <the reason / the problem being solved>

⚠️ Breaking / caveats: <only if there is something to flag — otherwise drop this line>
```

### Example

```md
Add a "copy link" button to the document toolbar so people can share a doc
without opening the address bar.

Why: sharing was a multi-step copy from the URL; this is one click.

⚠️ Breaking / caveats: none.
```

## Before opening

- Run `npm run lint` and `npm run typecheck`; fix what they surface.
- Title the PR with the same Angular format as the primary commit.
- If the repo has a PR template, fill its sections from the guidance above
  rather than adding your own headings.
- Do not open the PR unless the user asked for one.
