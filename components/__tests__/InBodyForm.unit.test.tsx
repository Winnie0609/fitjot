import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: {},
}));

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-uid' }, loading: false }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  addInBodyData: vi.fn(async () => ({ id: 'new-record' })),
  updateInBodyData: vi.fn(async () => undefined),
}));

import { toast } from 'sonner';
import { Mock } from 'vitest';

import { addInBodyData, updateInBodyData } from '@/lib/db';

import { InBodyForm } from '../InBodyForm';

describe('InBodyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('quick log saves when at least Weight or PBF provided', async () => {
    const user = userEvent.setup();
    render(
      <InBodyForm onSaved={vi.fn()} onClose={() => {}} initialData={null} />
    );

    // Provide Weight only
    const weightInput = screen.getByLabelText('Weight (kg)');
    await user.type(weightInput, '70.5');

    await user.click(screen.getByRole('button', { name: /Save Quick Log/i }));

    await waitFor(() => {
      expect(addInBodyData).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows Saving..., calls update, success toast', async () => {
    const user = userEvent.setup();

    // Create a controllable promise to manage submission state
    let resolveUpdate: (value?: unknown) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    (updateInBodyData as unknown as Mock).mockReturnValue(updatePromise);

    const initial = {
      id: 'rec-1',
      reportDate: new Date('2024-01-01T10:00:00Z'),
      reportTime: '10:00',
      bodyComposition: { totalWeight: { value: 70 } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    render(
      <InBodyForm onSaved={vi.fn()} onClose={() => {}} initialData={initial} />
    );

    // Edit a field (weight)
    const weightInput = screen.getByLabelText('Weight (kg)');
    await user.clear(weightInput);
    await user.type(weightInput, '71');

    // Click submit. The submission will start and then pause, waiting for our promise.
    user.click(screen.getByRole('button', { name: /Save Record/i }));

    // The form is in a stable "submitting" state.
    // Ensure both buttons are in their "Saving..." state.
    const savingBtns = await screen.findAllByRole('button', {
      name: /Saving.../i,
    });
    expect(savingBtns).toHaveLength(2);
    expect(savingBtns[0]).toBeDisabled();
    expect(savingBtns[1]).toBeDisabled();

    // Manually resolve the promise to allow the submission to complete
    await act(async () => {
      resolveUpdate();
    });

    // Wait for the final success state
    await waitFor(() => {
      expect(updateInBodyData).toHaveBeenCalledTimes(1);
      expect(addInBodyData).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows cross-field error when Weight and PBF both empty', async () => {
    const user = userEvent.setup();
    render(
      <InBodyForm onSaved={vi.fn()} onClose={() => {}} initialData={null} />
    );

    // Ensure both fields empty (default) and submit
    await user.click(screen.getByRole('button', { name: /Save Quick Log/i }));

    // Should show our refine message and not call API
    await waitFor(() => {
      expect(
        screen.getByText(/Either Weight or PBF is required./i)
      ).toBeInTheDocument();
      expect(addInBodyData).not.toHaveBeenCalled();
    });
  });

  it('rejects negative numbers', async () => {
    const user = userEvent.setup();
    render(
      <InBodyForm onSaved={vi.fn()} onClose={() => {}} initialData={null} />
    );

    const weightInput = screen.getByLabelText('Weight (kg)');
    await user.type(weightInput, '-1');

    await user.click(screen.getByRole('button', { name: /Save Quick Log/i }));

    // Expect a generic validation message to appear for invalid number
    // The exact message comes from zod min(0)
    await waitFor(() => {
      expect(addInBodyData).not.toHaveBeenCalled();
      // Field-level message should render via <FormMessage />
      // Accept either phrasing depending on zod formatting
      expect(screen.getByText(/Cannot be negative/i)).toBeInTheDocument();
    });
  });
});
