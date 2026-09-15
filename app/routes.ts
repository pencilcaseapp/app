import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/startpage.tsx'),
  layout('layouts/editor.tsx', [
    route('new', 'routes/new.tsx'),
    route('doc/:id', 'routes/doc.tsx', [
      route('settings', 'routes/settings.tsx', [
        index('routes/settings-menu.tsx'),
        route('account', 'routes/settings-account.tsx'),
        route('account/email', 'routes/settings-account-email.tsx'),
        route(
          'account/email/:requestId',
          'routes/settings-account-email-verify.tsx',
        ),
        route('subscription', 'routes/settings-subscription.tsx'),
        route('support', 'routes/settings-support.tsx'),
      ]),
    ]),
  ]),
  route('doc/:id/delete', 'routes/doc-delete.ts'),
  route('doc/:id/restore', 'routes/doc-restore.ts'),
  layout('layouts/auth.tsx', [
    route('signin', 'routes/signin.tsx'),
    route('otp/:otpId', 'routes/otp.tsx'),
    route('onboarding', 'routes/onboarding.tsx'),
  ]),
  route('signout', 'routes/signout.ts'),
  route('upgrade', 'routes/upgrade.ts'),
  route('invite/:code', 'routes/invite.ts'),
  route('billing-portal', 'routes/billing-portal.ts'),
  route('webhooks/creem', 'routes/creem-webhook.ts'),
  route('e2e/auth', 'routes/e2e-auth.ts'),
] satisfies RouteConfig;
