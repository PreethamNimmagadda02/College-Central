import { createDemoSeed } from '@features/demo/demoData';
import Grades from '@pages/Grades';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { GradesData } from '@/types';

// Hook results must be stable objects, or the page's effects re-run on every render
const mocks = vi.hoisted(() => ({
  config: { config: {} },
  user: { user: { id: 'u', name: 'Aarav Mehta', courseOption: 'NEP' }, updateUser: () => {} },
  grades: {
    gradesData: null as GradesData | null,
    loading: false,
    isProcessing: false,
    error: null,
    selectedFile: null,
    imagePreview: null,
    selectFile: () => {},
    processGrades: () => Promise.resolve(false),
    resetGradesState: () => {},
  },
  schedule: { scheduleData: [] },
}));

vi.mock('@contexts/AppConfigContext', () => ({ useAppConfig: () => mocks.config }));
vi.mock('@contexts/UserContext', () => ({ useUser: () => mocks.user }));
vi.mock('@contexts/GradesContext', () => ({ useGrades: () => mocks.grades }));
vi.mock('@contexts/ScheduleContext', () => ({ useSchedule: () => mocks.schedule }));

describe('Grades page', () => {
  it('gives the CGPA status badge its own text colour so it reads on its pale pill', () => {
    // The sample student's CGPA is 8.89, which the page labels Excellent
    mocks.grades.gradesData = createDemoSeed(new Date()).profile.gradesData ?? null;
    render(<Grades />);

    const badge = screen.getByText('Excellent', { selector: 'span.rounded-full' });
    // Light mode pairs the pale pill with dark text; dark mode keeps white text on its translucent pill
    expect(badge).toHaveClass('text-blue-600', 'dark:text-white');
  });
});
