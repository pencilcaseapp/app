import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/startpage.tsx'),
  layout('layouts/editor.tsx', [
    route('new', 'routes/new.tsx'),
    route('doc/:id', 'routes/doc.tsx'),
  ]),
  layout('layouts/auth.tsx', [
    route('signin', 'routes/signin.tsx'),
    route('otp/:otpId', 'routes/otp.tsx'),
    route('onboarding', 'routes/onboarding.tsx'),
  ]),
] satisfies RouteConfig;
