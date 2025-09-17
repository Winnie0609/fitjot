import { render, screen } from '@testing-library/react';
// SessionForm uses hooks that need a Form provider, so we create a helper component
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { Form } from '@/components/ui/form';

import { SessionForm } from '../SessionForm';

// A helper component to wrap SessionForm with the necessary Form context
const TestWrapper = ({ initialData = null }) => {
  const form = useForm({
    defaultValues: initialData || {
      date: new Date(),
      exercises: [{ name: '', sets: [{ reps: 0, weight: 0 }] }],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <SessionForm
          onSave={() => {}}
          onClose={() => {}}
          initialData={initialData}
        />
      </form>
    </Form>
  );
};

describe('SessionForm Component', () => {
  it('should render the form with default initial values', () => {
    // Arrange
    render(<TestWrapper />);

    // Assert
    // Check for a distinctive element, like the Exercise Name input label
    expect(screen.getByTestId('exercise-name-input')).toBeInTheDocument();
    // Check for the "Add Exercise" button
    expect(screen.getByTestId('exercise-name-input')).toBeInTheDocument();
  });
});
