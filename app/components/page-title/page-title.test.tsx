import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageTitle } from './page-title';

describe('PageTitle', () => {
  it('appends the app name to the given title', () => {
    render(<PageTitle>Hello World</PageTitle>);

    expect(document.title).toBe('Hello World – pencil case');
  });

  it('renders the app name alone without a title', () => {
    const emptyTitle = '';

    render(<PageTitle>{emptyTitle}</PageTitle>);

    expect(document.title).toBe('pencil case');
  });
});
