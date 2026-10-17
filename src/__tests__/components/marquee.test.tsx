import { Marquee } from '@components/ui/Marquee';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Marquee', () => {
  it('repeats its items for a seamless loop but lets screen readers hear them once', () => {
    render(
      <Marquee repeat={3}>
        <p>Great app</p>
      </Marquee>
    );

    // Every copy is on the page...
    expect(screen.getAllByText('Great app')).toHaveLength(3);
    // ...but only the first is in the accessibility tree
    expect(
      screen.getAllByText('Great app').filter((el) => !el.closest('[aria-hidden="true"]'))
    ).toHaveLength(1);
  });
});
