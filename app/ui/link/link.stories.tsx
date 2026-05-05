import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './link';

/**
 * The Link component is used to navigate to different
 * pages or sections within the application.
 * It can be rendered as a standard anchor tag
 * or as a custom component, such as a React Router Link.
 *
 * # Render as a React Router Link
 *
 * It's also possible to use the Link in combination with React Router.
 * Just pass the component of the routing library to the UI
 * component.
 *
 * ```tsx
 * import { Link } from 'react-router';
 * ...
 *
 * <Link as={Link} to="/some-route">
 *  React Router Link
 * </Link>
 * ```
 */
const meta: Meta<typeof Link> = {
  title: 'Navigation/Link',
  component: Link,
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: 'https://pencilcase.app',
    children: 'Go to pencil case',
    target: '_blank',
  },
};

export const WithCustomStyling: Story = {
  args: {
    href: 'https://pencilcase.app',
    children: 'Go to pencil case',
    target: '_blank',
    textColorLight: 'red-500',
    textColorDark: 'white',
  },
};
