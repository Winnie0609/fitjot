import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('firebase/auth', async () => {
  const mod = await vi.importActual<typeof import('firebase/auth')>(
    'firebase/auth'
  );
  return {
    ...mod,
    getAuth: vi.fn(),
    signOut: vi.fn(async () => {}),
    connectAuthEmulator: vi.fn(),
  };
});
