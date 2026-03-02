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
