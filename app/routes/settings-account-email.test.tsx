import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RouterContextProvider } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  optionalUserSessionContext,
  userSessionContext,
} from '~/contexts/user-session';
import { InitEmailChangeError } from '~/services/email-change';
import { emailChangeRequestFixture } from '~/test/fixtures/email-change-request';
import { userFixture } from '~/test/fixtures/user';
import { renderRoute } from '~/utils/testing';

const redirectMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    redirect: (url: string, init?: number | ResponseInit) => {
      redirectMock(url);
      return actual.redirect(url, init);
    },
  };
});

const initEmailChangeMock = vi.fn();
vi.mock('~/services/email-change', async importOriginal => ({
  ...await importOriginal<typeof import('~/services/email-change')>(),
  initEmailChange: (...args: unknown[]) => initEmailChangeMock(...args),
}));

const MOBILE_QUERY = '(width < 40rem)';

const useMediaMock = vi.fn().mockReturnValue(false);

vi.mock('react-use', async importOriginal => ({
  ...await importOriginal<typeof import('react-use')>(),
  useMedia: (query: string) => useMediaMock(query),
}));

const DOC_ID = '11111111-2222-4333-8444-555555555555';

async function renderEmail({ isMobile = false } = {}) {
  useMediaMock.mockImplementation(
    (query: string) => isMobile && query === MOBILE_QUERY,
  );

  const context = new RouterContextProvider();
  context.set(optionalUserSessionContext, userFixture);
  context.set(userSessionContext, userFixture);

  await renderRoute('/doc/:id/settings/account/email', {
    params: { id: DOC_ID },
    context,
    parentRoute: '/doc/:id/settings',
  });

  return userEvent.setup();
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('the change e-mail route', () => {
  test('stack on the account section with a back button', async () => {
    await renderEmail();

    expect(
      await screen.findByRole('dialog', { name: 'Change e-mail' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancel' }))
      .toHaveAttribute('href', `/doc/${DOC_ID}/settings/account`);
  });

  test('label the cancel link as back on mobile', async () => {
    await renderEmail({ isMobile: true });

    expect(await screen.findByRole('link', { name: 'Back' }))
      .toHaveAttribute('href', `/doc/${DOC_ID}/settings/account`);
  });

  test('start the change and continue to the code', async () => {
    initEmailChangeMock.mockResolvedValueOnce(
      [null, { request: emailChangeRequestFixture }],
    );
    const person = await renderEmail();

    await person.type(await screen.findByLabelText('E-mail'), 'new@example.com');
    await person.click(screen.getByRole('button', { name: 'Continue' }));

    await vi.waitFor(() => {
      expect(initEmailChangeMock)
        .toHaveBeenCalledWith(userFixture, 'new@example.com');
      expect(redirectMock).toHaveBeenCalledWith(
        `/doc/${DOC_ID}/settings/account/email/${emailChangeRequestFixture.id}`,
      );
    });
  });

  test('show the address is taken', async () => {
    initEmailChangeMock
      .mockResolvedValueOnce([InitEmailChangeError.EmailTaken]);
    const person = await renderEmail();

    await person.type(await screen.findByLabelText('E-mail'), 'new@example.com');
    await person.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText(
      'This e-mail address is already in use by another account.',
    )).toBeInTheDocument();
    expect(redirectMock)
      .not.toHaveBeenCalledWith(expect.stringContaining('/email/'));
  });

  test('show the rate limit', async () => {
    initEmailChangeMock
      .mockResolvedValueOnce([InitEmailChangeError.TooManyRequests]);
    const person = await renderEmail();

    await person.type(await screen.findByLabelText('E-mail'), 'new@example.com');
    await person.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Too many requests. Please try again later.'))
      .toBeInTheDocument();
  });
});
