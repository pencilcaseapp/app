import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/startpage.tsx'),
  route('home', 'routes/home.tsx'),
  route('new', 'routes/new.tsx'),
  layout('layouts/editor.tsx', [
    route('doc/:id', 'routes/doc.tsx'),
  ]),
] satisfies RouteConfig;
