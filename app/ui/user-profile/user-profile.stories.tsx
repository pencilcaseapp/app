import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserProfile } from './user-profile';

/**
 * `UserProfile` shows who is signed in: an avatar next to the name,
 * with the e-mail underneath. Users without a name are identified by
 * their e-mail alone.
 */
const meta: Meta<typeof UserProfile> = {
  title: 'Data Display/UserProfile',
  component: UserProfile,
  argTypes: {
    name: {
      control: { type: 'text' },
    },
    email: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserProfile>;

export const Default: Story = {
  args: {
    name: 'Pency Pencilton',
    email: 'pency@pencilcase.app',
  },
};

export const WithoutName: Story = {
  args: {
    name: null,
    email: 'pency@pencilcase.app',
  },
};

export const LongValues: Story = {
  render: () => (
    <div className="w-64">
      <UserProfile
        name="Pency Pencilton the Third of Pencilcase Manor"
        email="pency.pencilton.the.third@a-very-long-domain.example.com"
      />
    </div>
  ),
};
