import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import CollegeForms from './CollegeForms';

import { UserFormsData } from '@/types';

// Mock contexts
const mockFormsContext = {
  userFormsData: {
    favorites: [],
    recentDownloads: [],
  } as UserFormsData,
  loading: false,
  error: null,
  toggleFavorite: vi.fn(),
  addRecentDownload: vi.fn(),
};

const mockAppConfigContext = {
  config: {
    forms: [
      {
        title: 'Test Form 1',
        formNumber: 'TF-001',
        downloadLink: 'http://example.com/tf1.pdf',
        submitTo: 'Office A',
        category: 'general',
      },
    ],
  },
};

vi.mock('@contexts/FormsContext', () => ({
  useForms: () => mockFormsContext,
}));

vi.mock('@contexts/AppConfigContext', () => ({
  useAppConfig: () => mockAppConfigContext,
}));

describe('CollegeForms Accessibility and UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with aria-label', () => {
    render(<CollegeForms />);
    const searchInput = screen.getByRole('textbox', { name: 'Search forms' });
    expect(searchInput).toBeInTheDocument();
  });

  it('renders filter buttons with aria-pressed state', () => {
    render(<CollegeForms />);
    // Use exact match for button text to distinguish from cards
    const allFilter = screen.getByRole('button', { name: /^All$/i });

    // Initially 'All' should be pressed
    expect(allFilter).toHaveAttribute('aria-pressed', 'true');

    // 'Favorites' filter button
    const favoritesFilter = screen.getByRole('button', { name: /^Favorites$/i });
    expect(favoritesFilter).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders clear search button with aria-label', () => {
    render(<CollegeForms />);
    const searchInput = screen.getByRole('textbox', { name: 'Search forms' });
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(searchInput).toHaveValue('');
  });

  it('makes Favorites card keyboard accessible', () => {
    render(<CollegeForms />);

    // Now we can select by the accessible name we added
    const favoritesCard = screen.getByRole('button', { name: 'Filter by Favorites' });

    expect(favoritesCard).toHaveAttribute('tabIndex', '0');

    // Trigger Enter key
    fireEvent.keyDown(favoritesCard, { key: 'Enter', code: 'Enter' });

    // Check if filter changed to Favorites
    const favoritesFilter = screen.getByRole('button', { name: /^Favorites$/i });
    expect(favoritesFilter).toHaveAttribute('aria-pressed', 'true');
  });
});
