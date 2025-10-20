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
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { Fragment } from 'react';
import { useMemo } from 'react';

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
import { InBodyDataDocument } from '@/lib/types';

interface InBodyHistoryTableProps {
  records: (InBodyDataDocument & { id: string })[];
  onEdit: (record: InBodyDataDocument & { id: string }) => void;
  onDelete: (recordId: string) => void;
}

export function InBodyHistoryTable({
  records,
  onEdit,
  onDelete,
}: InBodyHistoryTableProps) {
  const columns = useMemo<ColumnDef<InBodyDataDocument & { id: string }>[]>(
    () => [
      {
        accessorKey: 'reportDate',
        header: 'Date',
        cell: ({ row }) => {
          const date = row.original.reportDate;
          return (
            <div className="text-sm">
              {date ? format(date, 'dd MMM yyyy') : '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'bodyComposition.totalWeight.value',
        header: 'Weight (kg)',
        cell: ({ row }) => {
          const weight = row.original.bodyComposition?.totalWeight?.value;
          return (
            <div data-testid="weight-cell" className="text-sm">
              {weight ?? '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'bodyComposition.pbf.value',
        header: 'PBF (%)',
        cell: ({ row }) => {
          const pbf = row.original.bodyComposition?.pbf?.value;
          return (
            <div data-testid="pbf-cell" className="text-sm">
              {pbf ?? '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'overallScore',
        header: 'Score',
        cell: ({ row }) => {
          const score = row.original.overallScore;
          return <div className="text-sm">{score ?? '-'}</div>;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const record = row.original;
          return (
            <div className="flex gap-1 items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(record);
                }}
                aria-label={`Edit record on ${format(
                  record.reportDate,
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
                  onDelete(record.id);
                }}
                aria-label={`Delete record on ${format(
                  record.reportDate,
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
    data: records,
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

  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        <p>No InBody records recorded yet.</p>
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
                      data-testid="inbody-record-row"
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
                            {/* Body Composition Summary */}
                            {row.original.bodyComposition && (
                              <div className="border-l-2 border-primary/20 pl-4">
                                <h4 className="font-medium text-sm">
                                  Body Composition
                                </h4>
                                <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-y-1">
                                  <div>
                                    Weight:{' '}
                                    {
                                      row.original.bodyComposition.totalWeight
                                        ?.value
                                    }
                                    {row.original.bodyComposition.totalWeight
                                      ? ' kg'
                                      : '-'}
                                  </div>
                                  <div>
                                    SMM:{' '}
                                    {
                                      row.original.bodyComposition
                                        .skeletalMuscleMass?.value
                                    }
                                    {row.original.bodyComposition
                                      .skeletalMuscleMass
                                      ? ' kg'
                                      : '-'}
                                  </div>
                                  <div>
                                    BFM:{' '}
                                    {
                                      row.original.bodyComposition.bodyFatMass
                                        ?.value
                                    }
                                    {row.original.bodyComposition.bodyFatMass
                                      ? ' kg'
                                      : '-'}
                                  </div>
                                  <div>
                                    BMI:{' '}
                                    {row.original.bodyComposition.bmi?.value ??
                                      '-'}
                                  </div>
                                  <div>
                                    PBF:{' '}
                                    {row.original.bodyComposition.pbf?.value ??
                                      '-'}
                                    %
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Body Composition Analysis (optional) */}
                            {row.original.bodyCompositionAnalysis && (
                              <div className="border-l-2 border-muted pl-4">
                                <h4 className="font-medium text-sm">
                                  Body Composition Analysis
                                </h4>
                                <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-y-1">
                                  <div>
                                    TBW:{' '}
                                    {
                                      row.original.bodyCompositionAnalysis
                                        .totalBodyWater?.value
                                    }
                                    {row.original.bodyCompositionAnalysis
                                      .totalBodyWater
                                      ? ' L'
                                      : '-'}
                                  </div>
                                  <div>
                                    Protein:{' '}
                                    {
                                      row.original.bodyCompositionAnalysis
                                        .protein?.value
                                    }
                                    {row.original.bodyCompositionAnalysis
                                      .protein
                                      ? ' kg'
                                      : '-'}
                                  </div>
                                  <div>
                                    Mineral:{' '}
                                    {
                                      row.original.bodyCompositionAnalysis
                                        .mineral?.value
                                    }
                                    {row.original.bodyCompositionAnalysis
                                      .mineral
                                      ? ' kg'
                                      : '-'}
                                  </div>
                                  <div>
                                    BFM:{' '}
                                    {
                                      row.original.bodyCompositionAnalysis
                                        .bodyFatMass?.value
                                    }
                                    {row.original.bodyCompositionAnalysis
                                      .bodyFatMass
                                      ? ' kg'
                                      : '-'}
                                  </div>
                                </div>
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
          const record = row.original;
          const date = record.reportDate;
          const weight = record.bodyComposition?.totalWeight?.value;
          const pbf = record.bodyComposition?.pbf?.value;
          const score = record.overallScore;
          const isExpanded = row.getIsExpanded();

          return (
            <div key={record.id} className="border rounded-lg overflow-hidden">
              <div
                className="p-4 bg-background cursor-pointer"
                onClick={() => row.toggleExpanded()}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {date ? format(date, 'dd MMM yyyy') : 'No date'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Weight: {weight ?? '-'} kg | PBF: {pbf ?? '-'}% | Score:{' '}
                      {score ?? '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(record);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(record.id);
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

                {/* Mobile Expanded Content */}
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {record.bodyComposition && (
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium text-foreground mb-1">
                          Body Composition
                        </div>
                        <div className="grid grid-cols-2 gap-y-1">
                          <div>
                            Weight: {record.bodyComposition.totalWeight?.value}
                            {record.bodyComposition.totalWeight ? ' kg' : '-'}
                          </div>
                          <div>
                            SMM:{' '}
                            {record.bodyComposition.skeletalMuscleMass?.value}
                            {record.bodyComposition.skeletalMuscleMass
                              ? ' kg'
                              : '-'}
                          </div>
                          <div>
                            BFM: {record.bodyComposition.bodyFatMass?.value}
                            {record.bodyComposition.bodyFatMass ? ' kg' : '-'}
                          </div>
                          <div>
                            BMI: {record.bodyComposition.bmi?.value ?? '-'}
                          </div>
                          <div>
                            PBF: {record.bodyComposition.pbf?.value ?? '-'}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Pagination - shared for both views */}
      <DataTablePagination table={table} />
    </div>
  );
}
