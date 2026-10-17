import { Android } from '@components/ui/Android';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Android', () => {
  it('describes what is on the screen to assistive technology', () => {
    render(<Android src="/shot.jpg" label="The Dashboard on an Android phone" />);

    expect(
      screen.getByRole('img', { name: 'The Dashboard on an Android phone' })
    ).toBeInTheDocument();
  });

  it('places the screenshot exactly over the screen it is clipped to', () => {
    const { container } = render(<Android src="/shot.jpg" label="Phone" />);

    const image = container.querySelector('image');
    const screenRect = container.querySelector('clipPath rect');
    expect(image).toHaveAttribute('x', '9');
    expect(image).toHaveAttribute('y', '14');
    expect(screenRect).toHaveAttribute('transform', 'translate(9 14)');
  });

  it('gives each phone its own clip path, so two on a page do not collide', () => {
    const { container } = render(
      <>
        <Android label="First" />
        <Android label="Second" />
      </>
    );

    const ids = [...container.querySelectorAll('clipPath')].map((clip) => clip.id);
    expect(new Set(ids).size).toBe(2);
  });
});
