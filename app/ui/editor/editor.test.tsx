import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Editor } from './editor';

test('renders placeholder', async () => {
  const { findByText } = render(
    <Editor
      placeholder={<div>Start here …</div>}
      ariaPlaceholder="Start here …"
      avatars={[]}
    />,
  );

  expect(await findByText('Start here …')).toBeInTheDocument();
});

test('renders avatars', async () => {
  const { findByText } = render(
    <Editor
      placeholder={<div>Start here …</div>}
      ariaPlaceholder="Start here …"
      avatars={['Alice', 'Bob', 'Charlie']}
    />,
  );

  expect(await findByText('Alice')).toBeInTheDocument();
  expect(await findByText('Bob')).toBeInTheDocument();
  expect(await findByText('Charlie')).toBeInTheDocument();
});
