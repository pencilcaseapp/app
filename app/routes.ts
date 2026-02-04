import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/index/index.ts'),
  route('home', 'routes/home/index.ts'),
  route('new', 'routes/new/index.ts'),
  layout('layouts/editor/editor.tsx', [
    route('doc/:id', 'routes/doc/index.ts'),
  ]),

] satisfies RouteConfig;
