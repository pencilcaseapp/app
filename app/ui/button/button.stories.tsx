import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';

/**
 * The Button component is used to trigger an action or event, such as
 * submitting a form, opening a dialog, canceling an action, or performing a
 * delete operation.
 *
 * # Render as a Remix Router Link
 *
 * It's also possible to use the Button in combination with Remix Router (aka
 * React Router). Just pass the component of the routing library to the UI
 * component.
 *
 * ```tsx
 * import { Link } from '@remix-run/react';
 *
 * ...
 *
 * <Button as={Link} to="/some-route">
 *  Remix Router Link
 * </Button>
 * ```
 */
const meta: Meta<typeof Button> = {
  title: 'Forms/Button',
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  render: () => (
    <div className="flex grow-0 flex-wrap gap-4">
      <Button onClick={() => console.log('clicked')}>
        Share
      </Button>
      <Button
        isLoading={true}
        onClick={() => console.log('clicked')}
      >
        Share
      </Button>
      <Button
        disabled={true}
        onClick={() => console.log('clicked')}
      >
        Share
      </Button>
      <Button
        onClick={() => console.log('clicked')}
        icon="share"
        iconPosition="start"
      >
        Share
      </Button>
      <Button
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Share
      </Button>
      <Button
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Share
      </Button>
      <Button
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Share
      </Button>
      <Button
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
    </div>
  ),
};

export const Secondary: Story = {
  render: () => (
    <div className="flex grow-0 flex-wrap gap-4">
      <Button colorLight="secondary" onClick={() => console.log('clicked')}>
        Share
      </Button>
      <Button
        colorLight="secondary"
        isLoading={true}
        onClick={() => console.log('clicked')}
      >
        Share
      </Button>
      <Button
        colorLight="secondary"
        disabled={true}
        onClick={() => console.log('clicked')}
      >
        Share
      </Button>
      <Button
        colorLight="secondary"
        onClick={() => console.log('clicked')}
        icon="share"
        iconPosition="start"
      >
        Share
      </Button>
      <Button

        colorLight="secondary"
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Share
      </Button>
      <Button

        colorLight="secondary"
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Share
      </Button>
      <Button

        colorLight="secondary"
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Share
      </Button>
      <Button

        colorLight="secondary"
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button

        colorLight="secondary"
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button

        colorLight="secondary"
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
    </div>
  ),
};

export const Upgrade: Story = {
  render: () => (
    <div className="flex grow-0 flex-wrap gap-4">
      <Button colorLight="upgrade" onClick={() => console.log('clicked')}>
        Upgrade
      </Button>
      <Button
        colorLight="upgrade"
        isLoading={true}
        onClick={() => console.log('clicked')}
      >
        Upgrade
      </Button>
      <Button
        colorLight="upgrade"
        disabled={true}
        onClick={() => console.log('clicked')}
      >
        Upgrade
      </Button>
      <Button
        colorLight="upgrade"
        onClick={() => console.log('clicked')}
        icon="share"
        iconPosition="start"
      >
        Upgrade
      </Button>
      <Button
        colorLight="upgrade"
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Upgrade
      </Button>
      <Button
        colorLight="upgrade"
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Upgrade
      </Button>
      <Button
        colorLight="upgrade"
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Upgrade
      </Button>
      <Button
        colorLight="upgrade"
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button
        colorLight="upgrade"
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button
        colorLight="upgrade"
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
    </div>
  ),
};

export const Danger: Story = {
  render: () => (
    <div className="flex grow-0 flex-wrap gap-4">
      <Button colorLight="danger" onClick={() => console.log('clicked')}>
        Delete
      </Button>
      <Button
        colorLight="danger"
        isLoading={true}
        onClick={() => console.log('clicked')}
      >
        Delete
      </Button>
      <Button
        colorLight="danger"
        disabled={true}
        onClick={() => console.log('clicked')}
      >
        Delete
      </Button>
      <Button
        colorLight="danger"
        onClick={() => console.log('clicked')}
        icon="share"
        iconPosition="start"
      >
        Delete
      </Button>
      <Button
        colorLight="danger"
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Delete
      </Button>
      <Button
        colorLight="danger"
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Delete
      </Button>
      <Button
        colorLight="danger"
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="share"
      >
        Delete
      </Button>
      <Button
        colorLight="danger"
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button
        colorLight="danger"
        isLoading={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
      <Button
        colorLight="danger"
        disabled={true}
        onClick={() => console.log('clicked')}
        icon="h1"
      />
    </div>
  ),
};
