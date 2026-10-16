import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMock = vi.hoisted(() => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
}));
const authMock = vi.hoisted(() => ({
  value: {
    isGuest: true,
    isAuthenticated: true,
    loading: false,
    currentUser: { uid: 'demo-guest' },
  },
}));
const userMock = vi.hoisted(() => ({ value: { user: { id: 'demo-guest' } } }));

vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('@lib/firebase', () => ({ db: {}, auth: {}, storage: {} }));
vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => authMock.value }));
vi.mock('@contexts/UserContext', () => ({ useUser: () => userMock.value }));
vi.mock('@contexts/AppConfigContext', () => ({ useAppConfig: vi.fn() }));
vi.mock('@features/profiles/components/PublicProfile', () => ({
  PublicProfile: ({ user }: { user: { name: string } }) => <h1>{user.name}</h1>,
}));

import NotificationCenter from '@components/layout/NotificationCenter';
import { useAppConfig } from '@contexts/AppConfigContext';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';
import Directory from '@pages/Directory';
import UserProfile from '@pages/UserProfile';

const renderDirectory = () => {
  vi.mocked(useAppConfig).mockReturnValue({
    config: { directory: [], students: getDemoState().directory },
    loading: false,
  } as unknown as ReturnType<typeof useAppConfig>);

  // Directory reports a missing profile with a toast, which App mounts a Toaster for
  render(
    <MemoryRouter initialEntries={['/directory']}>
      <Routes>
        <Route path="/directory" element={<Directory />} />
        <Route path="/u/:userId" element={<UserProfile />} />
      </Routes>
      <Toaster />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: /^Students/ }));
};

const searchStudents = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText('Search by name, admission number, or branch...'), {
    target: { value: text },
  });

describe('pages in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    vi.clearAllMocks();
  });

  it('shows demo notifications and marks them read locally', () => {
    render(
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('Welcome to the demo!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mark all read'));

    expect(getDemoState().notifications.every((n) => n.read)).toBe(true);
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
    expect(firestoreMock.onSnapshot).not.toHaveBeenCalled();
    expect(firestoreMock.writeBatch).not.toHaveBeenCalled();
  });

  it('opens a classmate profile from the student directory', async () => {
    renderDirectory();
    searchStudents('Ananya');
    fireEvent.click((await screen.findAllByText('ANANYA BHATTACHARJEE'))[0]!);

    expect(
      await screen.findByRole('heading', { name: 'Ananya Bhattacharjee' })
    ).toBeInTheDocument();
    expect(firestoreMock.getDocs).not.toHaveBeenCalled();
    expect(firestoreMock.getDoc).not.toHaveBeenCalled();
  });

  it('says so when a classmate has no profile yet', async () => {
    renderDirectory();
    searchStudents('Aditi');
    fireEvent.click((await screen.findAllByText('ADITI HEGDE'))[0]!);

    expect(await screen.findByText('This user has not created a profile yet.')).toBeInTheDocument();
    expect(firestoreMock.getDocs).not.toHaveBeenCalled();
  });

  it("shows User not found for a real user's link", async () => {
    render(
      <MemoryRouter initialEntries={['/u/k3Jd9sQ0aPz8W1xYvB2nM4cR7tL5']}>
        <Routes>
          <Route path="/u/:userId" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('User not found')).toBeInTheDocument();
    expect(firestoreMock.getDoc).not.toHaveBeenCalled();
  });
});
