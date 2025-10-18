'use client';

import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (recordId: string) => {
    const next = new Set(expandedRows);
    if (next.has(recordId)) next.delete(recordId);
    else next.add(recordId);
    setExpandedRows(next);
  };

  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        <p>No InBody records recorded yet.</p>
        <p>Click &quot;Add New Record&quot; to get started!</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="border rounded-lg">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 px-8 bg-muted/30 border-b text-sm font-medium text-muted-foreground">
            <div className="col-span-3">Date</div>
            <div className="col-span-2">Weight (kg)</div>
            <div className="col-span-2">PBF (%)</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-3"></div>
          </div>

          {/* Table Rows */}
          {records.map((record) => {
            const date = record.reportDate;
            const weight = record.bodyComposition?.totalWeight?.value;
            const pbf = record.bodyComposition?.pbf?.value;
            const score = record.overallScore;
            const isExpanded = expandedRows.has(record.id);

            return (
              <div
                data-testid="inbody-record-row"
                key={record.id}
                className="border-b last:border-b-0"
              >
                <div
                  className="grid grid-cols-12 gap-4 p-4 px-8 hover:bg-muted/20 transition-colors items-center cursor-pointer"
                  onClick={() => toggleRow(record.id)}
                >
                  {/* Date */}
                  <div className="col-span-3 text-sm">
                    {date ? format(date, 'dd MMM yyyy') : '-'}
                  </div>
                  {/* Weight */}
                  <div data-testid="weight-cell" className="col-span-2 text-sm">
                    {weight ?? '-'}
                  </div>
                  {/* PBF */}
                  <div data-testid="pbf-cell" className="col-span-2 text-sm">
                    {pbf ?? '-'}
                  </div>
                  {/* Score */}
                  <div className="col-span-2 text-sm">{score ?? '-'}</div>
                  {/* Actions */}
                  <div className="col-span-3 flex gap-1 items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(record)}
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
                      onClick={() => onDelete(record.id)}
                      aria-label={`Delete record on ${format(
                        record.reportDate,
                        'dd MMM yyyy'
                      )}`}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div
                    className="px-8 pb-4 bg-muted/10"
                    onClick={() => toggleRow(record.id)}
                  >
                    <div className="grid gap-4">
                      {/* Body Composition Summary */}
                      {record.bodyComposition && (
                        <div className="border-l-2 border-primary/20 pl-4">
                          <h4 className="font-medium text-sm">
                            Body Composition
                          </h4>
                          <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-y-1">
                            <div>
                              Weight:{' '}
                              {record.bodyComposition.totalWeight?.value}
                              {record.bodyComposition.totalWeight ? ' kg' : ''}
                            </div>
                            <div>
                              SMM:{' '}
                              {record.bodyComposition.skeletalMuscleMass?.value}
                              {record.bodyComposition.skeletalMuscleMass
                                ? ' kg'
                                : ''}
                            </div>
                            <div>
                              BFM: {record.bodyComposition.bodyFatMass?.value}
                              {record.bodyComposition.bodyFatMass ? ' kg' : ''}
                            </div>
                            <div>BMI: {record.bodyComposition.bmi?.value}</div>
                            <div>PBF: {record.bodyComposition.pbf?.value}%</div>
                          </div>
                        </div>
                      )}

                      {/* Body Composition Analysis (optional) */}
                      {record.bodyCompositionAnalysis && (
                        <div className="border-l-2 border-muted pl-4">
                          <h4 className="font-medium text-sm">
                            Body Composition Analysis
                          </h4>
                          <div className="mt-1 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-y-1">
                            <div>
                              TBW:{' '}
                              {
                                record.bodyCompositionAnalysis.totalBodyWater
                                  ?.value
                              }
                              {record.bodyCompositionAnalysis.totalBodyWater
                                ? ' L'
                                : ''}
                            </div>
                            <div>
                              Protein:{' '}
                              {record.bodyCompositionAnalysis.protein?.value}
                              {record.bodyCompositionAnalysis.protein
                                ? ' kg'
                                : ''}
                            </div>
                            <div>
                              Mineral:{' '}
                              {record.bodyCompositionAnalysis.mineral?.value}
                              {record.bodyCompositionAnalysis.mineral
                                ? ' kg'
                                : ''}
                            </div>
                            <div>
                              BFM:{' '}
                              {
                                record.bodyCompositionAnalysis.bodyFatMass
                                  ?.value
                              }
                              {record.bodyCompositionAnalysis.bodyFatMass
                                ? ' kg'
                                : ''}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden space-y-3">
        {records.map((record) => {
          const date = record.reportDate;
          const weight = record.bodyComposition?.totalWeight?.value;
          const pbf = record.bodyComposition?.pbf?.value;
          const score = record.overallScore;
          const isExpanded = expandedRows.has(record.id);

          return (
            <div key={record.id} className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-background">
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
                      onClick={() => onEdit(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(record.id)}
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
                            {record.bodyComposition.totalWeight ? ' kg' : ''}
                          </div>
                          <div>
                            SMM:{' '}
                            {record.bodyComposition.skeletalMuscleMass?.value}
                            {record.bodyComposition.skeletalMuscleMass
                              ? ' kg'
                              : ''}
                          </div>
                          <div>
                            BFM: {record.bodyComposition.bodyFatMass?.value}
                            {record.bodyComposition.bodyFatMass ? ' kg' : ''}
                          </div>
                          <div>BMI: {record.bodyComposition.bmi?.value}</div>
                          <div>PBF: {record.bodyComposition.pbf?.value}%</div>
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
    </div>
  );
}
