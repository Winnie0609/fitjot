import { Check,ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ExerciseData } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ExerciseSelect({
  field,
  exerciseData,
  exIndex,
}: {
  field: FieldValues;
  exerciseData: ExerciseData[];
  exIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const { setValue } = useFormContext();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            `justify-between ${
              field.value ? 'text-primary' : 'text-muted-foreground'
            }`,
            'w-full'
          )}
        >
          {field.value
            ? exerciseData.find((exercise) => exercise.id === field.value)
                ?.titleEn
            : 'Select exercise'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Search exercise" className="h-9" />
          <CommandList>
            <CommandEmpty>No exercise found.</CommandEmpty>
            <CommandGroup>
              {exerciseData.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.titleEn}
                  onSelect={() => {
                    field.onChange(exercise.id);
                    setOpen(false);
                    setValue(
                      `exercises.${exIndex}.name`,
                      exercise.titleEn || '',
                      {
                        shouldValidate: true,
                      }
                    );
                  }}
                >
                  {exercise.titleEn}
                  <Check
                    className={cn(
                      'ml-auto',
                      field.value === exercise.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
