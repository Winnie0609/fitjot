'use client';

import { format } from 'date-fns';
import { Loader2, Plus, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AppLayout } from '@/components/AppLayout';
import { InBodyHistoryTable } from '@/components/InBodyHistoryTable';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load InBodyForm - only load when modal opens
const InBodyForm = dynamic(
  () =>
    import('@/components/InBodyForm').then((mod) => ({
      default: mod.InBodyForm,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
    ssr: false, // Form doesn't need SSR
  }
);
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
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
  }, [user]);

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  const handleRecordSaved = async () => {
    await refresh(); // Wait for data to refresh before closing form
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
    setIsDeleting(true);
    try {
      await deleteInBodyData({ recordId: recordToDelete.id });
      void refresh();
      toast.success(
        `InBody record for ${format(
          recordToDelete.reportDate,
          'dd MMM yyyy'
        )} has been deleted.`
      );
      setRecordToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
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
        <div data-testid="skeleton-loader" className="overflow-hidden">
          {/* Desktop Table Skeleton */}
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
              {/* Table Rows Skeleton */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-b last:border-b-0">
                  <div className="p-4 px-8">
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile List Skeleton */}
          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <InBodyHistoryTable
          records={inBodyRecords}
          onEdit={handleEdit}
          onDelete={(recordId) => {
            const record = inBodyRecords.find((r) => r.id === recordId);
            if (record) handleDeleteRequest(record);
          }}
        />
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="container mx-auto max-w-2xl p-4 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingRecord ? 'Edit InBody Record' : 'Create a New Record'}
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
        open={!!recordToDelete || (!!recordToDelete && isDeleting)}
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
            <AlertDialogCancel
              onClick={() => setRecordToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Continue'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function InBodyPage() {
  return (
    <AppLayout>
      <InBodyPageContent />
    </AppLayout>
  );
}
