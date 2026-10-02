import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '../src/app/page';
import { ToastProvider } from '../src/components/ui/toaster';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
  global.ResizeObserver = class {
    observe() {
      /* Browser tests cover observer callbacks. */
    }
    unobserve() {
      /* Browser tests cover observer callbacks. */
    }
    disconnect() {
      /* No subscriptions in this test. */
    }
  };
  global.IntersectionObserver = class {
    observe() {
      /* Visibility is exercised in browser tests. */
    }
    unobserve() {
      /* Browser tests cover observer callbacks. */
    }
    disconnect() {
      /* No subscriptions in this test. */
    }
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  };
});

it('keeps the landing message and demo navigation available', async () => {
  render(
    <ToastProvider>
      <Page />
    </ToastProvider>,
  );
  await screen.findByRole('heading', { level: 1 });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(
    'heard.',
  );
  expect(
    screen
      .getAllByRole('link', { name: 'Try the demo' })[0]
      .getAttribute('href'),
  ).toBe('/dashboard');
});
