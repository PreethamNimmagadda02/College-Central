import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import QuoteSection from './QuoteSection';
import * as AppConfigContext from '@contexts/AppConfigContext';

// Mock the context hook
vi.mock('@contexts/AppConfigContext', () => ({
  useAppConfig: vi.fn(),
}));

describe('QuoteSection', () => {
  it('renders a quote from config', () => {
    const mockConfig = {
      quotes: [{ text: 'Test Quote', author: 'Test Author' }],
    };
    // @ts-ignore
    (AppConfigContext.useAppConfig as any).mockReturnValue({ config: mockConfig });

    render(<QuoteSection />);
    expect(screen.getByText('"Test Quote"')).toBeInTheDocument();
    expect(screen.getByText('— Test Author')).toBeInTheDocument();
  });

  it('renders default quote if config is empty', () => {
    // @ts-ignore
    (AppConfigContext.useAppConfig as any).mockReturnValue({ config: {} });

    render(<QuoteSection />);
    // Default quote text
    expect(screen.getByText(/"The only way to do great work is to love what you do."/)).toBeInTheDocument();
  });
});
