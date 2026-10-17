import { DotPattern } from '@components/ui/DotPattern';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DotPattern', () => {
  it('draws one repeating tile, so its cost does not grow with the area it covers', () => {
    const { container } = render(<DotPattern />);

    expect(container.querySelectorAll('pattern')).toHaveLength(1);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
    const fill = container.querySelector('rect')?.getAttribute('fill');
    const patternId = container.querySelector('pattern')?.id;
    expect(fill).toBe(`url(#${patternId})`);
  });

  it('is decorative, so assistive technology skips it', () => {
    const { container } = render(<DotPattern />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
