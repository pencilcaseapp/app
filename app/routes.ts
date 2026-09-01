import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/startpage.tsx'),
  layout('layouts/editor.tsx', [
    route('new', 'routes/new.tsx'),
    route('doc/:id', 'routes/doc.tsx', [
      route('settings', 'routes/settings.tsx', [
        index('routes/settings-menu.tsx'),
        route('account', 'routes/settings-account.tsx'),
        route('subscription', 'routes/settings-subscription.tsx'),
        route('support', 'routes/settings-support.tsx'),
      ]),
    ]),
  ]),
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
