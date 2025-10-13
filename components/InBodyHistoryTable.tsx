'use client';

import { format } from 'date-fns';
import { Edit, Trash2 } from 'lucide-react';

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

            return (
              <div
                data-testid="inbody-record-row"
                key={record.id}
                className="border-b last:border-b-0"
              >
                <div className="grid grid-cols-12 gap-4 p-4 px-8 hover:bg-muted/20 transition-colors items-center">
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
                  </div>
                </div>
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
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
