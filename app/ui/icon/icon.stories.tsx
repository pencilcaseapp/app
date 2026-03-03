import type { Meta } from '@storybook/react-vite';
import { Icon } from './icon';

const meta = {
  title: 'Data Display/Icons',
  component: Icon,
} satisfies Meta<typeof Icon>;
export default meta;

export const CustomStyles = {
  render: () => <Icon icon="h1" className="text-pca-blue-700" />,
  name: 'CustomStyles',
};
