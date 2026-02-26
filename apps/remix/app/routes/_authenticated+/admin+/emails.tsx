import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Eye, Loader, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc, type RouterOutputs } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import type { DataTableColumnDef, RowSelectionState } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import { useToast } from '@documenso/ui/primitives/use-toast';

type EmailRow = RouterOutputs['admin']['email']['find']['data'][number];

export default function AdminEmailsPage() {
  const { t, i18n, _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, refetch } = trpc.admin.email.find.useQuery({
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
  });

  const { mutate: retryEmail, isPending: isRetrying } = trpc.admin.email.retry.useMutation({
    onSuccess: () => {
      toast({ title: t`Email resent successfully` });
      void refetch();
    },
    onError: () => {
      toast({ title: t`Failed to resend email`, variant: 'destructive' });
    },
  });

  const { mutateAsync: bulkDeleteEmails, isPending: isBulkDeleting } =
    trpc.admin.email.bulkDelete.useMutation();

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => results.data[Number(key)]?.id)
      .filter((id): id is string => id !== undefined);
  }, [rowSelection, results.data]);

  const onBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(_(msg`Are you sure you want to delete ${selectedIds.length} emails?`))) {
      return;
    }

    try {
      const result = await bulkDeleteEmails({ ids: selectedIds });
      toast({
        title: _(msg`Emails deleted`),
        description: _(msg`Successfully deleted ${result.deletedCount} emails.`),
      });
      setRowSelection({});
      navigate('.', { replace: true });
    } catch (err) {
      toast({
        title: _(msg`Error`),
        description: _(msg`Failed to delete emails.`),
        variant: 'destructive',
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={_(msg`Select all`)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={_(msg`Select row`)}
          />
        ),
        size: 40,
      },
      {
        header: t`To`,
        accessorKey: 'to',
      },
      {
        header: t`Subject`,
        accessorKey: 'subject',
      },
      {
        header: t`Status`,
        accessorKey: 'status',
        cell: ({ row }: { row: { original: EmailRow } }) => (
          <Badge variant={row.original.status === 'SENT' ? 'default' : 'neutral'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        header: t`Tracking`,
        cell: ({ row }: { row: { original: EmailRow } }) => {
          const interactions = row.original.interactions || [];
          const opens = interactions.filter((i) => i.type === 'OPEN').length;
          return (
            <div className="flex flex-col text-xs">
              <span>
                <Trans>Opens</Trans>: {opens}
              </span>
              {row.original.deliveredAt && (
                <span className="text-green-600">
                  <Trans>Delivered</Trans>
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: t`Sent At`,
        accessorKey: 'createdAt',
        cell: ({ row }: { row: { original: EmailRow } }) => i18n.date(row.original.createdAt),
      },
      {
        id: 'actions',
        cell: ({ row }: { row: { original: EmailRow } }) => (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{row.original.subject}</DialogTitle>
                </DialogHeader>
                <div
                  className="prose prose-sm dark:prose-invert mt-4 rounded-md border bg-white p-4 text-black"
                  dangerouslySetInnerHTML={{ __html: row.original.body }}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => retryEmail({ id: row.original.id })}
              disabled={isRetrying}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.locale, isRetrying, retryEmail, _],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-semibold">
          <Trans>Emails</Trans>
        </h2>
        {selectedIds.length > 0 && (
          <div className="flex flex-row items-center gap-2 rounded-md bg-muted px-3 py-1 animate-in fade-in slide-in-from-top-1">
            <span className="text-sm font-medium">
              <Trans>{selectedIds.length} selected</Trans>
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              loading={isBulkDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <Trans>Delete</Trans>
            </Button>
          </div>
        )}
      </div>
      <div className="relative">
        <DataTable
          columns={columns}
          data={results.data}
          perPage={results.perPage}
          currentPage={results.currentPage}
          totalPages={results.totalPages}
          onPaginationChange={(page, perPage) => updateSearchParams({ page, perPage })}
          enableRowSelection={true}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          skeleton={{ enable: isLoading, rows: 5 }}
        >
          {(table) => <DataTablePagination table={table} />}
        </DataTable>

        {(isLoading || isBulkDeleting) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
            <Loader className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}
      </div>
    </div>
  );
}
