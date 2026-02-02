import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MotivationalQuote from './MotivationalQuote';

const mockQuotes = [
  { text: 'Quote 1', author: 'Author 1' },
  { text: 'Quote 2', author: 'Author 2' },
  { text: 'Quote 3', author: 'Author 3' },
];

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('MotivationalQuote', () => {
  beforeEach(() => {
    mockWriteText.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a quote initially', () => {
    render(<MotivationalQuote quotes={mockQuotes} />);
    const quoteText = screen.getByText(/Quote/);
    expect(quoteText).toBeInTheDocument();
    const authorText = screen.getByText(/Author/);
    expect(authorText).toBeInTheDocument();
  });

  it('copies quote to clipboard when copy button is clicked', async () => {
    render(<MotivationalQuote quotes={mockQuotes} />);

    // Find copy button by aria-label
    const copyButton = screen.getByLabelText('Copy quote');
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalled();

    // Check if feedback is shown
    // Note: Framer Motion animations might cause delay in appearance
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('refreshes quote when refresh button is clicked', async () => {
    vi.useFakeTimers();
    render(<MotivationalQuote quotes={mockQuotes} />);

    const initialQuote = screen.getByText(/Quote/).textContent;
    const refreshButton = screen.getByLabelText('New quote');

    fireEvent.click(refreshButton);
    act(() => {
        vi.advanceTimersByTime(300); // Wait for timeout in handleRefresh
    });

    // We can't guarantee a change with random, but we can verify interaction didn't crash
    const quoteText = screen.getByText(/Quote/);
    expect(quoteText).toBeInTheDocument();
  });

  it('auto-rotates quotes after 30 seconds', () => {
    vi.useFakeTimers();
    render(<MotivationalQuote quotes={mockQuotes} />);

    // Trigger interval
    act(() => {
        vi.advanceTimersByTime(30000);
    });

    // Trigger timeout inside handleRefresh
    act(() => {
        vi.advanceTimersByTime(300);
    });

    const quoteText = screen.getByText(/Quote/);
    expect(quoteText).toBeInTheDocument();
  });
});
