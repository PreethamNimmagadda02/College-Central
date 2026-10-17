import { MagicCard } from '@components/ui/MagicCard';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MagicCard', () => {
  it('moves the spotlight with the pointer without re-rendering its content', async () => {
    let renders = 0;
    const LoginForm = () => {
      renders += 1;
      return <p>Sign in</p>;
    };
    render(
      <MagicCard data-testid="card">
        <LoginForm />
      </MagicCard>
    );
    const card = screen.getByTestId('card');

    fireEvent.pointerMove(card, { clientX: 40, clientY: 30 });
    fireEvent.pointerMove(card, { clientX: 90, clientY: 60 });

    await waitFor(() => expect(card.style.getPropertyValue('--spot-x')).toBe('90px'));
    expect(card.style.getPropertyValue('--spot-y')).toBe('60px');
    expect(renders).toBe(1);
  });
});
