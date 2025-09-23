'use client';

import { format } from 'date-fns';
import { Edit, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppLayout } from '@/components/AppLayout';
import { InBodyForm } from '@/components/InBodyForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/lib/AppDataContext';
import { useAuth } from '@/lib/AuthContext';
import { deleteInBodyData } from '@/lib/db';
import { InBodyDataDocument } from '@/lib/types';

function InBodyPageContent() {
  const { user } = useAuth();
  const { inBodyRecords, refresh, loading } = useAppData();
  const [editingRecord, setEditingRecord] = useState<
    (InBodyDataDocument & { id: string }) | null
  >(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<
    (InBodyDataDocument & { id: string }) | null
  >(null);

  useEffect(() => {
    if (!user) return;
  }, [user]);

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const handleRecordSaved = () => {
    void refresh();
    handleFormClose();
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: InBodyDataDocument & { id: string }) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (record: InBodyDataDocument & { id: string }) => {
    setRecordToDelete(record);
  };

  const performDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteInBodyData({ recordId: recordToDelete.id });
      void refresh();
      toast.success('Record deleted');
      setRecordToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center md:flex-row flex-col gap-4 items-start">
        <div>
          <h1 className="text-3xl font-bold">InBody Records</h1>
          <p className="text-muted-foreground">
            Track your body composition over time
          </p>
        </div>
        <Button onClick={handleAddNew} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add New Record
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading records...
        </div>
      ) : inBodyRecords.length === 0 ? (
        <div className="text-center text-muted-foreground mt-8">
          <p>No inbody records recorded yet.</p>
          <p>Click &quot;Add New Record&quot; to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inBodyRecords.map((r) => {
            const date = r.reportDate || undefined;
            const weight = r.bodyComposition?.totalWeight?.value;
            const pbf = r.bodyComposition?.pbf?.value;
            const score = r.overallScore;
            return (
              <div
                key={r.id || ''}
                className="flex items-center justify-between border rounded-md p-3"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm min-w-[120px]">
                    {date ? format(date, 'dd MMM yyyy') : '-'}
                  </div>
                  <div className="text-sm">Weight: {weight ?? '-'} kg</div>
                  <div className="text-sm">PBF: {pbf ?? '-'} %</div>
                  <div className="text-sm">Score: {score ?? '-'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(r)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteRequest(r)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="container mx-auto max-w-2xl p-4 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingRecord
                  ? 'Edit InBody Record'
                  : 'Create New InBody Record'}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleFormClose}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <InBodyForm
              onSaved={handleRecordSaved}
              onClose={handleFormClose}
              initialData={editingRecord}
            />
          </div>
        </div>
      )}

      <AlertDialog
        open={!!recordToDelete}
        onOpenChange={(open) => !open && setRecordToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record from{' '}
              {recordToDelete && recordToDelete.reportDate
                ? format(recordToDelete.reportDate, 'dd MMM yyyy')
                : 'this date'}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRecordToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={performDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function InBodyPage() {
  return (
    <AppLayout>
      <InBodyPageContent />
    </AppLayout>
  );
}
