'use client';

import Fuse from 'fuse.js';
import { Check, ChevronsUpDown } from 'lucide-react';
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

interface ExerciseSelectProps {
  field: FieldValues;
  exerciseData: ExerciseData[];
  exIndex: number;
}

const fuseOptions = {
  includeScore: true,
  keys: ['titleEn', 'titleZh', 'aliases'],
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

  const fuse = new Fuse(exerciseData, fuseOptions);

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
            onValueChange={(query) => {
              if (query.length > 0) {
                const results = fuse.search(query).map((result) => result.item);
                setSearchResults(results);
              } else {
                setSearchResults(exerciseData);
              }
            }}
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
