'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Frown,
  Meh,
  Smile,
  Trash2,
} from 'lucide-react';
import { Fragment } from 'react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getWorkoutCategories } from '@/lib/summary';
import { Session, WorkoutSet } from '@/lib/types';

// Helper function to group sets
function groupSets(sets: WorkoutSet[]) {
  const grouped = new Map<
    string,
    { reps: number; weight: number; count: number }
  >();
  sets.forEach((set) => {
    const key = `${set.reps}x${set.weight}`;
    if (grouped.has(key)) {
      grouped.get(key)!.count++;
    } else {
      grouped.set(key, { ...set, count: 1 });
    }
  });
  return Array.from(grouped.values());
}

const moodIcons = {
  happy: <Smile className="h-5 w-5 text-green-500" />,
  neutral: <Meh className="h-5 w-5 text-yellow-500" />,
  sad: <Frown className="h-5 w-5 text-red-500" />,
};

interface WorkoutHistoryTableProps {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
}

export function WorkoutHistoryTable({
  sessions,
  onEdit,
  onDelete,
}: WorkoutHistoryTableProps) {
  const columns = useMemo<ColumnDef<Session>[]>(
    () => [
      {
        accessorKey: 'mood',
        header: '',
        cell: ({ row }) => {
          const mood = row.original.mood;
          return <div>{mood && moodIcons[mood]}</div>;
        },
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => {
          return (
            <div className="text-sm">
              {format(row.original.date, 'dd MMM yyyy')}
            </div>
          );
        },
      },
      {
        id: 'categories',
        header: 'Categories',
        cell: ({ row }) => {
          const categories = getWorkoutCategories(row.original.exercises);
          return (
            <div className="max-w-[200px]">
              <div className="flex flex-wrap gap-1">
                {categories.slice(0, 5).map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
                {categories.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{categories.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'exercises',
        header: 'Exercises',
        cell: ({ row }) => {
          return (
            <div className="text-sm text-muted-foreground">
              {row.original.exercises.length} exercises
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const session = row.original;
          return (
            <div className="flex gap-1 items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(session);
                }}
                aria-label={`Edit session on ${format(
                  session.date,
                  'dd MMM yyyy'
                )}`}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                aria-label={`Delete session on ${format(
                  session.date,
                  'dd MMM yyyy'
                )}`}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
              {row.getIsExpanded() ? (
                <ChevronUp className="h-3 w-3 mr-1" />
              ) : (
                <ChevronDown className="h-3 w-3 mr-1" />
              )}
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (sessions.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        <p>No workout sessions recorded yet.</p>
        <p>Click &quot;Add New Record&quot; to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-muted/30">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow
                      data-testid="workout-session-row"
                      data-state={row.getIsExpanded() && 'expanded'}
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => row.toggleExpanded()}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="bg-muted/10 py-4"
                        >
                          <div className="grid gap-4">
                            {row.original.exercises.map((exercise) => (
                              <div
                                key={exercise.id}
                                className="border-l-2 border-primary/20 pl-4"
                              >
                                <h4 className="font-medium text-sm">
                                  {exercise.name}
                                  {exercise.rpe && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs ml-2"
                                    >
                                      RPE {exercise.rpe}
                                    </Badge>
                                  )}
                                </h4>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {groupSets(exercise.sets).map(
                                    (set, index) => (
                                      <div key={index} className="flex">
                                        <span className="mr-3">
                                          {set.count} × {set.reps} reps @{' '}
                                          {set.weight}kg
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            ))}
                            {row.original.notes && (
                              <div className="border-l-2 border-muted pl-4">
                                <h4 className="font-medium text-sm">Notes</h4>
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                  {row.original.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows.map((row) => {
          const session = row.original;
          const categories = getWorkoutCategories(session.exercises);
          const isExpanded = row.getIsExpanded();

          return (
            <div key={session.id} className="border rounded-lg overflow-hidden">
              {/* Mobile Row Header */}
              <div
                className="p-4 bg-background cursor-pointer"
                onClick={() => row.toggleExpanded()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {session.mood && moodIcons[session.mood]}
                    <div>
                      <div className="text-sm">
                        {format(session.date, 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.exercises.length} exercises
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(session);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(session.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Categories on mobile */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-xs"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Mobile Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 bg-muted/10 border-t">
                  <div className="space-y-3 mt-3">
                    {session.exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="border-l-2 border-primary/20 pl-3"
                      >
                        <h4 className="font-medium text-sm">
                          {exercise.name}
                          {exercise.rpe && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              RPE {exercise.rpe}
                            </Badge>
                          )}
                        </h4>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {groupSets(exercise.sets).map((set, index) => (
                            <div key={index} className="flex">
                              <div className="mr-3">
                                {set.count} × {set.reps} reps @ {set.weight}kg
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {session.notes && (
                      <div className="border-l-2 border-muted pl-3">
                        <h4 className="font-medium text-sm">Notes</h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {session.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination - shared for both views */}
      <DataTablePagination table={table} />
    </div>
  );
}
