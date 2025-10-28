'use client';

import Fuse from 'fuse.js';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
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

interface ExerciseSelectProps {
  field: FieldValues;
  exerciseData: ExerciseData[];
  exIndex: number;
}

const fuseOptions = {
  includeScore: true,
  keys: ['titleEn', 'titleZh', 'aliases'],
  minMatchCharLength: 2,
};

export function ExerciseSelect({
  field,
  exerciseData,
  exIndex,
}: ExerciseSelectProps) {
  const { setValue } = useFormContext();
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] =
    useState<ExerciseData[]>(exerciseData);

  const fuseInstance = new Fuse(exerciseData, fuseOptions);

  const performSearch = useCallback(
    (query: string) => {
      if (query.length > 0) {
        const results = fuseInstance.search(query).map((result) => result.item);
        setSearchResults(results);
      } else {
        setSearchResults(exerciseData);
      }
    },
    [fuseInstance, exerciseData]
  );

  // Debounced search function, execute after 200ms
  const handleSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      // clear previous timer
      clearTimeout(timeoutId);

      // new timer, execute search after 200ms
      timeoutId = setTimeout(() => {
        performSearch(query);
      }, 200);
    };
  }, [performSearch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !field.value && 'text-muted-foreground'
          )}
          data-testid="exercise-select"
          ref={field.ref}
          onBlur={field.onBlur}
        >
          {field.value
            ? exerciseData.find((exercise) => exercise.id === field.value)
                ?.titleEn
            : 'Select exercise'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        side="bottom"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search by name"
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>No exercise found.</CommandEmpty>
            <CommandGroup>
              {searchResults.map((exercise) => (
                <CommandItem
                  className="w-[300px] md:w-full"
                  key={exercise.id}
                  value={exercise.titleEn}
                  onSelect={() => {
                    // set name
                    setValue(`exercises.${exIndex}.name`, exercise.titleEn, {
                      shouldValidate: true,
                    });
                    field.onChange(exercise.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      field.value === exercise.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate" title={exercise.titleEn}>
                    {exercise.titleEn}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
