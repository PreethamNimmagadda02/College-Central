import { OfflineIndicator } from '@components/common/OfflineIndicator';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('OfflineIndicator', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
    });
  });

  const mockOnlineStatus = (isOnline: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: isOnline,
    });
    window.dispatchEvent(new Event(isOnline ? 'online' : 'offline'));
  };

  it('renders nothing when online initially', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders offline message when offline initially', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    render(<OfflineIndicator />);

    // Check for offline message
    expect(screen.getByText("You're offline")).toBeInTheDocument();
    // Should have alert role for accessibility
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows offline message when going offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    render(<OfflineIndicator />);

    act(() => {
      mockOnlineStatus(false);
    });

    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });

  it('shows back online message when coming back online', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    render(<OfflineIndicator />);

    // First ensure we are offline
    expect(screen.getByText("You're offline")).toBeInTheDocument();

    act(() => {
      mockOnlineStatus(true);
    });

    expect(screen.getByText('Back online!')).toBeInTheDocument();
    // Should have status role for accessibility
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Check that offline message is gone
    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
  });

  it('hides back online message after delay', () => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    render(<OfflineIndicator />);

    act(() => {
      mockOnlineStatus(true);
    });

    expect(screen.getByText('Back online!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Back online!')).not.toBeInTheDocument();
  });
});
