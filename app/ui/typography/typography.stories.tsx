import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography } from './typography';

/**
 * The Typography component wraps everything you need to render text in the
 * pencil case app.
 * It supports headlines, paragraphs, and span elements and some additional
 * options to transform the text. The component comes with some defaults based
 * on the variant. Let's take a look at the variants we have in place:
 */
const meta: Meta<typeof Typography> = {
  title: 'Data Display/Typography',
  component: Typography,
};

export default meta;
type Story = StoryObj<typeof Typography>;

/**
 * ### Default Mapping
 *
 * The goal is to have a smart component in place with some defaults to make it
 * as easy as possible to implement. Therefore, we have implemented a default
 * mapping for the HTML element. It is also possible to override the default
 * mapping by passing the `as` prop (see [polymorphic
 * components](#polymorphic-component-as-prop) section).
 *
 * | **Variant** | **Default HTML Element (Level)** |
 * | ----------- | -------------------------------- |
 * | title       | h1                               |
 * | heading1    | h1                               |
 * | heading2    | h2                               |
 * | heading3    | h3                               |
 * | body        | p                                |
 * | bodySmall   | p                                |
 * | bodyTiny    | p                                |
 */

export const Variants: Story = {
  render: () => (
    <>
      <Typography textColorLight="grey-900" variant="title">Title</Typography>
      <Typography variant="heading1">Heading 1</Typography>
      <Typography variant="heading2">Heading 2</Typography>
      <Typography variant="heading3">Heading 3</Typography>
      <Typography variant="body">Body</Typography>
      <Typography variant="bodySmall">Body Small</Typography>
      <Typography variant="bodyTiny">Body Tiny</Typography>
    </>
  ),
};

export const Colors: Story = {
  render: () => (
    <>
      <Typography textColorLight="blue-500" variant="title">
        Title
      </Typography>
      <Typography textColorLight="red-500" variant="heading1">
        Heading 1
      </Typography>
      <Typography textColorLight="orange-500" variant="heading2">
        Heading 2
      </Typography>
      <Typography textColorLight="green-500" variant="heading3">
        Heading 3
      </Typography>
      <Typography textColorLight="grey-700" variant="body">
        Body
      </Typography>
      <Typography textColorLight="grey-400" variant="bodySmall">
        Body Small
      </Typography>
      <Typography textColorLight="grey-300" variant="bodyTiny">
        Body Tiny
      </Typography>
    </>
  ),
};

/**
 * We do not encourage this use case, but if you need to change the
 * `font-weight` of the text you can pass the `fontWeight` prop to the
 * component.
 */

export const FontWeight: Story = {
  render: () => (
    <>
      <Typography variant="title" fontWeight="regular" className="mb-4">
        Title with regular font weight
      </Typography>
    </>
  ),
};

export const TextTransform: Story = {
  render: () => (
    <>
      <Typography textTransform="lowercase" variant="heading3">
        Almost before we knew it, we had left the ground.
      </Typography>
      <Typography textTransform="capitalize" variant="heading3">
        Almost before we knew it, we had left the ground.
      </Typography>
      <Typography textTransform="uppercase" variant="heading3">
        Almost before we knew it, we had left the ground.
      </Typography>
    </>
  ),
};

export const TextAlign: Story = {
  render: () => (
    <>
      <Typography textAlign="center" variant="heading3">
        Almost before we knew it, we had left the ground.
      </Typography>
      <Typography textAlign="right" variant="heading3">
        Almost before we knew it, we had left the ground.
      </Typography>
      <Typography textAlign="left" variant="heading3">
        Almost before we knew it, we had left the ground.
      </Typography>
    </>
  ),
};

/**
 * The Typography component supports custom styles by passing the `className`
 * prop to it. Since we use TailwindCSS you can add any utility class to the
 * component you need. In this case we just add some `margin-bottom` to the
 * heading.
 */

export const CustomStyles: Story = {
  parameters: {
    docs: {
      canvas: {
        sourceState: 'shown',
      },
    },
  },
  render: () => (
    <>
      <Typography variant="heading1" className="mb-4">
        Heading 1
      </Typography>
      <Typography>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </Typography>
    </>
  ),
};

/**
 * The Typography component is a polymorphic component. This means you can pass
 * any html element to the component and it will render the element you passed.
 * In this case we pass a `label` element to the component.
 */
export const PolymorphicComponentAsProp: Story = {
  parameters: {
    docs: {
      canvas: {
        sourceState: 'shown',
      },
    },
  },
  render: () => (
    <>
      <Typography as="h3" variant="title" className="mb-7">
        Title as H3
      </Typography>
      <Typography
        as="label"
        variant="body"
        textColorLight="grey-600"
        fontWeight="semibold"
        htmlFor="name"
      >
        Label
      </Typography>
      <input
        className="focus:shadow-outline mb-3 w-full appearance-none rounded-sm border border-pca-red-500 px-3 py-2 leading-tight text-pca-grey-700 shadow-sm focus:outline-hidden"
        type="text"
        placeholder="Nothing special..."
        name="name"
        id="name"
      />
    </>
  ),
};
