import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRoutesStub, RouterContextProvider } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { userFixture } from '~/test/fixtures/user';
import LayoutEditor, { loader } from './editor';

vi.mock('~/repos/document', () => ({
  getDocumentList: vi.fn().mockResolvedValue([]),
}));

const DOC_ID = '11111111-2222-4333-8444-555555555555';

function renderEditorLayout(initialPath: string) {
  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);

  const Stub = createRoutesStub([
    {
      Component: LayoutEditor as React.ComponentType,
      loader,
      children: [
        {
          path: 'doc/:id',
          Component: () => <div>Document</div>,
          children: [
            { path: 'settings', Component: () => null },
          ],
        },
      ],
    },
  ], context);

  return render(<Stub initialEntries={[initialPath]} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LayoutEditor', () => {
  test('keeps the settings dialog closed on the document route', async () => {
    renderEditorLayout(`/doc/${DOC_ID}`);

    expect(await screen.findByText('Document')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens the settings dialog on the settings route', async () => {
    renderEditorLayout(`/doc/${DOC_ID}/settings`);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(userFixture.name!)).toBeInTheDocument();
  });

  test('closing the dialog navigates back to the document', async () => {
    const user = userEvent.setup();
    renderEditorLayout(`/doc/${DOC_ID}/settings`);

    await user.click(
      await screen.findByRole('button', { name: 'Close' }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();
  });
});
