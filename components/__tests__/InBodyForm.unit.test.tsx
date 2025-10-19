import { render, screen, waitFor } from '@testing-library/react';
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

  it('update flow: shows Saving..., calls update, success toast', async () => {
    const user = userEvent.setup();
    // Make add not be called in this test; update is the target
    (addInBodyData as unknown as Mock).mockResolvedValue({ id: 'x' });
    (updateInBodyData as unknown as Mock).mockResolvedValue(undefined);

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

    // Click Save Record (bottom form)
    await user.click(screen.getByRole('button', { name: /Save Record/i }));

    // Button should show Saving... and be disabled
    const savingBtn = await screen.findByRole('button', { name: /Saving.../i });
    expect(savingBtn).toBeDisabled();

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
        screen.getByText('Either Weight or PBF is required')
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
      expect(
        screen.getByText(
          /cannot be negative|must be greater than or equal to 0/i
        )
      ).toBeInTheDocument();
    });
  });
});
