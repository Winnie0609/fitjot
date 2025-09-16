import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../Header';

// This setup is now handled by vitest.setup.unit.ts, but we keep it here
// for file-specific overrides if needed in the future.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('firebase/auth', async () => {
  const mod = await vi.importActual<typeof import('firebase/auth')>(
    'firebase/auth'
  );
  return {
    ...mod,
    getAuth: vi.fn(),
    signOut: vi.fn(() => Promise.resolve()),
    connectAuthEmulator: vi.fn(),
  };
});

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false }), // Simulate a logged-in user
}));

describe('Header Component', () => {
  it('should render successfully when a user is logged in', () => {
    // Arrange: Render the Header component
    render(<Header handleAddNew={() => {}} />);

    // Assert: Check if the user's avatar and the "Add New" button are present.
    const addNewButton = screen.getByTestId('add-new-session-button');
    expect(addNewButton).toBeInTheDocument();

    const userAvatar = screen.getByTestId('user-avatar');
    expect(userAvatar).toBeInTheDocument();
  });
});
