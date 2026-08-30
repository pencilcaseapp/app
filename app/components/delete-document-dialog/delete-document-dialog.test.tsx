import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { setViewportWidth } from '~/utils/testing';
import { DeleteDocumentDialog } from './delete-document-dialog';

const onOpenChange = vi.fn();
const onConfirm = vi.fn();

function renderDialog({ open = true }: { open?: boolean } = {}) {
  return render(
    <DeleteDocumentDialog
      documentTitle="Meeting notes"
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  setViewportWidth(1024);
});

describe('DeleteDocumentDialog', () => {
  test('renders nothing while closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('names the document in the confirmation copy', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete document')).toBeInTheDocument();
    expect(
      screen.getByText(/“Meeting notes” will be deleted/),
    ).toBeInTheDocument();
  });

  test('closes through the cancel button', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('confirms through the delete button', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalled();
  });
});
