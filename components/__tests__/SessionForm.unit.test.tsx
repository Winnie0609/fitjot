import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
// SessionForm uses hooks that need a Form provider, so we create a helper component
import { Mock, vi } from 'vitest';

import { addWorkoutSession, updateWorkoutSession } from '@/lib/db';

import { SessionForm } from '../SessionForm';

// Mock the firebase module BEFORE any imports that depend on it
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid' },
  },
  db: {},
}));

// Mock the AuthContext to provide a controlled user state
vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-uid' },
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock child components and hooks to isolate SessionForm
vi.mock('@/components/ExerciseSelect', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ExerciseSelect: (props: any) => (
    <input
      data-testid={`exercise-select-${props.exIndex}`}
      value={props.field.value}
      onChange={props.field.onChange}
    />
  ),
}));

vi.mock('@/lib/db', () => ({
  addWorkoutSession: vi.fn(),
  updateWorkoutSession: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function deferred<T>() {
  let resolve!: (v: T) => void, reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// A helper component to wrap SessionForm with all necessary contexts
const TestWrapper = ({
  initialData = null,
  onSaved = () => {},
}: {
  initialData?: {
    id: string;
    date: Date;
    mood?: 'happy' | 'neutral' | 'sad';
    notes?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exercises: any[];
  } | null;
  onSaved?: () => void;
}) => {
  return (
    <SessionForm
      onSaved={onSaved}
      onClose={() => {}}
      initialData={initialData}
      exerciseData={[]} // Mocked, as ExerciseSelect is mocked
      isFormOpen={true}
    />
  );
};

const mockSessionData = {
  id: 'session-1',
  date: new Date('2024-01-01T10:00:00Z'),
  mood: 'happy' as const,
  notes: 'Good workout',
  exercises: [
    {
      id: 'ex-1',
      exerciseId: 'bench-press-id',
      name: 'Bench Press',
      sets: [
        { id: 'set-1', reps: 10, weight: 100 },
        { id: 'set-2', reps: 8, weight: 110 },
      ],
    },
    {
      id: 'ex-2',
      exerciseId: 'squat-id',
      name: 'Squat',
      sets: [{ id: 'set-3', reps: 12, weight: 200 }],
    },
  ],
};

const mockSessionDataWithInvalidExercise = {
  id: 'session-2',
  date: new Date('2024-01-01T10:00:00Z'),
  mood: 'happy' as const,
  notes: 'Good workout',
  exercises: [
    {
      id: 'ex-1',
      exerciseId: '',
      name: '',
      sets: [],
    },
  ],
};

describe('SessionForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with default initial values for a new session', () => {
    // Arrange
    render(<TestWrapper />);

    // Assert
    // Check for one exercise input by default
    expect(screen.getByTestId('exercise-select-0')).toBeInTheDocument();
    // Check that a second one does not exist
    expect(screen.queryByTestId('exercise-select-1')).not.toBeInTheDocument();
    // Check for the "Add Exercise" button
    expect(
      screen.getByRole('button', { name: /Add Exercise/i })
    ).toBeInTheDocument();
  });

  it('should populate form fields correctly when editing an existing session', () => {
    // Arrange
    render(<TestWrapper initialData={mockSessionData} />);

    // Assert
    // Check if the notes are populated
    expect(screen.getByRole('textbox', { name: /Notes/i })).toHaveValue(
      'Good workout'
    );

    // Check if both exercises are rendered with correct values
    expect(screen.getByTestId('exercise-select-0')).toHaveValue(
      'bench-press-id'
    );
    expect(screen.getByTestId('exercise-select-1')).toHaveValue('squat-id');

    // Check if set values for the first exercise are correct
    const repsInputs = screen.getAllByTestId('reps-input');
    const weightInputs = screen.getAllByTestId('weight-input');

    expect(repsInputs[0]).toHaveValue(10);
    expect(weightInputs[0]).toHaveValue(100);
    expect(repsInputs[1]).toHaveValue(8);
    expect(weightInputs[1]).toHaveValue(110);
  });

  it('should add a new exercise when "Add Exercise" button is clicked', async () => {
    const user = userEvent.setup();
    // Arrange
    render(<TestWrapper />);

    // Assert initial state: one exercise
    expect(screen.getByTestId('exercise-select-0')).toBeInTheDocument();
    expect(screen.queryByTestId('exercise-select-1')).not.toBeInTheDocument();

    // Act
    const addExerciseButton = screen.getByRole('button', {
      name: /Add Exercise/i,
    });
    await user.click(addExerciseButton);

    // Assert final state: two exercises
    expect(screen.getByTestId('exercise-select-0')).toBeInTheDocument();
    expect(screen.getByTestId('exercise-select-1')).toBeInTheDocument();
  });

  it('should delete an exercise when "Delete Exercise" button is clicked', async () => {
    const user = userEvent.setup();
    // Arrange
    render(<TestWrapper initialData={mockSessionData} />);

    // Assert initial state: two exercises
    expect(screen.getByTestId('exercise-select-0')).toBeInTheDocument();
    expect(screen.getByTestId('exercise-select-1')).toBeInTheDocument();

    // Act
    const removeButtons = screen.getAllByTestId('remove-exercise-button');
    await user.click(removeButtons[0]);

    // Assert alert dialog is open
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    await user.click(screen.getByText('Continue'));

    // Assert final state: one exercise
    expect(screen.getAllByTestId('remove-exercise-button')).toHaveLength(1);
    expect(screen.getByTestId('exercise-select-0')).toHaveValue('squat-id');
    expect(screen.queryByTestId('exercise-select-1')).not.toBeInTheDocument();
  });

  it('should delete a set when "Delete Set" button is clicked', async () => {
    const user = userEvent.setup();

    // Arrange
    render(<TestWrapper initialData={mockSessionData} />);

    // Assert initial state: one exercise
    const exercise0 = screen.getByTestId('exercise-0');
    expect(exercise0).toBeInTheDocument();

    // Act
    const deleteButtonsIn0 =
      within(exercise0).getAllByTestId('delete-set-button');
    await user.click(deleteButtonsIn0[1]); // delete the second set

    // Assert final state: one set
    expect(within(exercise0).getAllByTestId('delete-set-button')).toHaveLength(
      1
    );
  });

  it('should show an error message when the form is submitted with invalid data', async () => {
    const user = userEvent.setup();

    // Arrange
    render(<TestWrapper initialData={mockSessionDataWithInvalidExercise} />);

    // Act
    const saveButton = screen.getByRole('button', { name: /Save Session/i });
    await user.click(saveButton);

    // Assert
    expect(screen.getByText('Exercise is required.')).toBeInTheDocument();
  });

  it('should save the session when the form is submitted', async () => {
    const user = userEvent.setup();
    const notes = 'So tired.';

    // Arrange
    render(<TestWrapper initialData={mockSessionData} />);

    // Act
    await user.clear(screen.getByRole('textbox', { name: /Notes/i }));
    await user.type(screen.getByRole('textbox', { name: /Notes/i }), notes);
    const saveButton = screen.getByRole('button', { name: /Save Session/i });
    await user.click(saveButton);

    // Assert
    expect(screen.getByRole('textbox', { name: /Notes/i })).toHaveValue(notes);
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/Session for .* has been updated\./)
    );
  });

  it('disables button and shows "Saving..." while submitting (create)', async () => {
    const user = userEvent.setup();
    const addDef = deferred<{ id: string }>();
    (addWorkoutSession as unknown as Mock).mockImplementation(
      () => addDef.promise
    );
    (updateWorkoutSession as unknown as Mock).mockResolvedValue(undefined);

    // Arrange
    render(<TestWrapper />);

    // Act
    // minimal valid data
    await user.type(screen.getByTestId('exercise-select-0'), 'bench-press-id');
    const reps = screen.getAllByTestId('reps-input');
    const weight = screen.getAllByTestId('weight-input');
    await user.clear(reps[0]);
    await user.type(reps[0], '10');
    await user.clear(weight[0]);
    await user.type(weight[0], '100');

    // submit -> pending state
    await user.click(screen.getByRole('button', { name: /Save Session/i }));
    const savingBtn = await screen.findByRole('button', {
      name: /Saving\.{3}/i,
    });

    // Assert
    expect(savingBtn).toBeDisabled();

    // resolve request to avoid leaking pending promises
    addDef.resolve({ id: 'new-doc-id' });
  });

  it('creates session: calls add and not update', async () => {
    const user = userEvent.setup();
    (addWorkoutSession as unknown as Mock).mockResolvedValue({
      id: 'new-doc-id',
    });
    (updateWorkoutSession as unknown as Mock).mockResolvedValue(undefined);

    render(<TestWrapper />);

    // minimal valid data
    await user.type(screen.getByTestId('exercise-select-0'), 'bench-press-id');
    const reps = screen.getAllByTestId('reps-input');
    const weight = screen.getAllByTestId('weight-input');
    await user.clear(reps[0]);
    await user.type(reps[0], '10');
    await user.clear(weight[0]);
    await user.type(weight[0], '100');

    await user.click(screen.getByRole('button', { name: /Save Session/i }));

    await waitFor(() => {
      expect(addWorkoutSession).toHaveBeenCalledTimes(1);
      expect(updateWorkoutSession).not.toHaveBeenCalled();
    });
  });
});
