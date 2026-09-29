import type { Preview } from '@storybook/react-vite';

import '../app/app.css';
import '../app/fonts.css';
import './preview.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
