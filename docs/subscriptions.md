# Subscriptions (Creem)

The pro subscription is sold through [Creem](https://docs.creem.io), a
merchant of record: Creem owns the checkout, payment methods, receipts,
invoices, sales tax and the retry/dunning machinery for failed payments.
Our side mirrors the subscription state into Postgres and switches
`users.has_subscription`, which is what the app gates the pro features
on. Nothing about money lives in our code — only state.

## The flow

- **`/upgrade`** (signed in) shows a single upgrade button, or a
  "Manage subscription" button once a subscription exists. The action
  creates a checkout session through `POST /v1/checkouts` — prefilled
  with the account email, or with the user's `creem_customer_id` when
  they had a subscription before, so Creem reuses the customer — and
  redirects the browser to Creem's hosted checkout
  (`redirectDocument`: leaving the app is always a full navigation).
  The user id rides along as `metadata.userId`; that metadata is
  attached to the subscription and comes back in every webhook, which
  is how events find the account no matter what email was used to pay.
- **`/upgrade/callback`** is the `success_url`. Creem appends the
  checkout/subscription/customer ids plus a `signature` — a SHA-256
  over the parameters in URL order, salted with the API key — which
  `verifyRedirectSignature` checks before anything else. The loader
  then loads the subscription from the API, stores it, flips the flag
  and renders the confirmation. The callback is a UX path, not the
  source of truth: the webhook does the same idempotent sync, so
  whichever arrives first wins and the other one is a no-op. A user
  who closes the tab on Creem's "payment successful" screen still
  gets pro through the webhook.
- **`/webhooks/creem`** receives Creem's events, verified against the
  `creem-signature` header (HMAC-SHA256 of the raw body with the
  webhook secret). Every event is recorded in `creem_webhook_events`
  under Creem's event id — the raw payload is kept for debugging and
  replay — and then processed.
- **`/billing-portal`** asks Creem for a customer portal session and
  redirects to it. The upgrade page opens it in a new tab; inside,
  customers cancel subscriptions, change payment methods and download
  invoices without us building any of it.

## State

`subscriptions` mirrors one Creem subscription per row (`status` is
plain text on purpose — a new Creem status must not break the sync).
Two details are load-bearing:

- **Out-of-order events.** Creem retries deliveries and order is not
  guaranteed, so the row keeps Creem's own `updated_at` and
  `upsertSubscription` refuses to apply anything older than what is
  stored — a stale `subscription.active` retry can never resurrect a
  canceled subscription.
- **Access is computed from status, notifications from event type.**
  After every sync, `has_subscription` is recomputed from the stored
  statuses: `active`, `trialing`, `past_due` (Creem is still
  retrying — the grace period) and `scheduled_cancel` (paid until the
  period ends) keep the features on; `canceled`, `expired`, `unpaid`
  and `paused` switch them off. What *happened* (the event type) only
  decides which email goes out.

The account for an event is resolved through the subscription already
stored, then `metadata.userId`, then the `creem_customer_id` linked to
a user. An event nobody matches is logged, recorded and acknowledged —
Creem retrying it forever would not make a user appear.

## Webhook events

| Event | State | Email |
| --- | --- | --- |
| `checkout.completed` | syncs the embedded subscription | — |
| `subscription.active` / `.paid` / `.trialing` / `.update` | sync | started, first time a subscription is stored with access |
| `subscription.past_due` | sync (features stay on) | payment failed, with a portal link |
| `subscription.canceled` | sync (features off) | canceled |
| `subscription.scheduled_cancel` | sync (features stay on until the period ends) | — (a retention email would go here) |
| `subscription.unpaid` / `.paused` / `.expired` | sync per status | — |
| `refund.created` / `dispute.created` | syncs the embedded subscription | — (Creem notifies the customer) |
| anything else | recorded only | — |

Deliveries are retried by Creem (30s, 5m, 30m, 6h; nothing after 24h)
and can arrive twice, so the event id is the idempotency key: an event
with `processed_at` set is acknowledged without doing anything again,
one without it (a crashed attempt) is processed once more — the sync
itself is idempotent. A handler failure answers 500 so Creem retries;
rows with `processed_at IS NULL` are therefore the thing to look at
when debugging, and events can be re-sent manually from Creem's
dashboard under Developers.

## Emails — what Creem sends, what we send

Creem, as merchant of record, already emails the customer:

- the **receipt and invoice** after every successful payment,
  including the magic link into their customer portal,
- **"update your payment method"** notices while it retries a failed
  renewal (its dunning cycle),
- the **refund confirmation** when a payment is refunded.

So we send no receipts, no invoices and no refund emails. We do send
three product emails (`app/emails/templates/`):

- **subscription-started** — Creem's receipt is about the money, not
  the product; this one confirms pro is on.
- **subscription-payment-failed** — strictly redundant with Creem's
  dunning notice, and kept anyway: it is branded, links straight into
  `/billing-portal`, and a recovered renewal pays for a lot of
  duplicate emails. Sent on `past_due`, once per event.
- **subscription-canceled** — Creem sends nothing when a subscription
  ends; this confirms it and points back to `/upgrade`.

There is no trial email because the product has no trial; add one on
`subscription.trialing` if that changes.

## Configuration

`config.creem` (see `app/config/`): `apiUrl`, `apiKey`, `productId`,
`webhookSecret`. The dev defaults point at our shared test-mode store,
except for the API key, which is never checked in — put it in `.env`
(loaded by the dev server) to talk to real Creem test mode; without it
only the fake Creem of the e2e tests works. The API client wraps the
official `creem` SDK; only the redirect-signature check is hand-rolled
because the SDK has no helper for it.

| Variable | From |
| --- | --- |
| `CREEM_API_URL` | `https://test-api.creem.io` or `https://api.creem.io` — test and live are separate environments |
| `CREEM_API_KEY` | Dashboard → Developers (per environment) |
| `CREEM_PRODUCT_ID` | Dashboard → Products → Copy ID |
| `CREEM_WEBHOOK_SECRET` | Dashboard → Developers → Webhook |

Webhooks need a reachable URL: register
`https://<host>/webhooks/creem` in the dashboard (test and live each
have their own registration and secret). Locally, tunnel with ngrok
and set `CREEM_WEBHOOK_SECRET` to the secret shown for the tunnel
registration; without a tunnel the callback path alone still activates
subscriptions, only the later lifecycle events go unseen.

Test-mode cards: `4111 1111 1111 1111` succeeds,
`4507 9900 0000 0028` declines, `4507 9900 0000 0010` has insufficient
funds — any future expiry and CVC.

## Testing

The services and repos are unit tested offline — webhook handling,
signatures, idempotency and the access policy all live there. The e2e
specs (`e2e/subscription.spec.ts`) drive Creem's real test-mode
checkout end to end when `CREEM_API_KEY` is set and skip without it —
see `docs/e2e.md`. Webhooks are the one thing e2e cannot cover (Creem
cannot reach localhost or CI), so after changes to the webhook
handling, test it by hand: tunnel with ngrok, cancel in the portal,
pay with the decline card, and watch the deliveries land — the
dashboard's Developers page lists every delivery and lets you
re-send.

## Going live

1. Create the product in the live dashboard and set
   `CREEM_PRODUCT_ID` to its id.
2. Set `CREEM_API_KEY` to the live key; leave `CREEM_API_URL` unset in
   prod (it defaults to `https://api.creem.io`).
3. Register `https://pencilcase.app/webhooks/creem` in the live
   dashboard and set `CREEM_WEBHOOK_SECRET` to its secret.
4. Pay once with a real card, watch the events arrive, refund it from
   the dashboard.
