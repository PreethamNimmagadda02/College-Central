import { AnimatedList } from '@components/ui/AnimatedList';
import { render, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import { describe, expect, it } from 'vitest';

const Inbox = ({ items }: { items: string[] }) => (
  <MotionConfig reducedMotion="never">
    <AnimatedList>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </AnimatedList>
  </MotionConfig>
);

describe('AnimatedList', () => {
  it('shows every item straight away, in the order given', () => {
    render(<Inbox items={['Fee due', 'Exam schedule', 'Holiday']} />);

    const shown = screen.getAllByText(/Fee due|Exam schedule|Holiday/).map((el) => el.textContent);
    expect(shown).toEqual(['Fee due', 'Exam schedule', 'Holiday']);
  });

  it('animates a removed item out before unmounting it', async () => {
    const { rerender } = render(<Inbox items={['Fee due', 'Holiday']} />);

    rerender(<Inbox items={['Holiday']} />);

    expect(screen.getByText('Fee due')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Fee due')).not.toBeInTheDocument());
  });
});
