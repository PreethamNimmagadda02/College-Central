import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  uploadProfilePicture: vi.fn(() => Promise.resolve()),
  toastError: vi.fn(),
  createObjectURL: vi.fn(() => 'blob:preview'),
}));

vi.mock('@features/auth/hooks/useAuth', () => ({ useAuth: () => ({ isGuest: true }) }));
vi.mock('@contexts/UserContext', () => ({
  useUser: () => ({ updateUser: vi.fn(), uploadProfilePicture: mocks.uploadProfilePicture }),
}));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError, success: vi.fn() } }));

import { getDemoState } from '@features/demo/demoStore';
import { PublicProfile } from '@features/profiles/components/PublicProfile';

describe('PublicProfile in guest mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = mocks.createObjectURL;
  });

  it('explains that the photo is fixed in the demo instead of trying to upload', () => {
    const { container } = render(
      <PublicProfile user={getDemoState().profile} isOwnProfile isEditing />
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'me.png', { type: 'image/png' })] },
    });

    expect(mocks.toastError).toHaveBeenCalledWith("Profile pictures can't be changed in the demo.");
    expect(mocks.uploadProfilePicture).not.toHaveBeenCalled();
    expect(mocks.createObjectURL).not.toHaveBeenCalled();
  });
});
