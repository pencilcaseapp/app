import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|tsx)', '../app/**/*.mdx'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
};

export default config;
