import { useMemo, useState } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc } from '@documenso/trpc/react';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { Button } from '@documenso/ui/primitives/button';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { Badge } from '@documenso/ui/primitives/badge';
import { RotateCcw, Trash } from 'lucide-react';

export default function AdminJobsPage() {
  const { _, i18n } = useLingui();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const [rowSelection, setRowSelection] = useState({});

  const { data, isLoading, refetch } = trpc.admin.job.findAll.useQuery({
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
  });

  const { mutate: retryJob, isPending: isRetrying } = trpc.admin.job.retry.useMutation({
    onSuccess: () => {
      toast({ title: _(msg`Job marked for retry`) });
      void refetch();
    },
    onError: () => {
      toast({ title: _(msg`Failed to retry job`), variant: 'destructive' });
    },
  });

  const { mutate: bulkDelete, isPending: isDeleting } = trpc.admin.job.bulkDelete.useMutation({
    onSuccess: () => {
      toast({ title: _(msg`Jobs deleted successfully`) });
      setRowSelection({});
      void refetch();
    },
    onError: () => {
      toast({ title: _(msg`Failed to delete jobs`), variant: 'destructive' });
    },
  });

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: { table: any }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: { row: any }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        header: _(msg`Name`),
        accessorKey: 'name',
      },
      {
        header: _(msg`Status`),
        accessorKey: 'status',
        cell: ({ row }: { row: { original: any } }) => (
          <Badge
            variant={
              row.original.status === 'COMPLETED'
                ? 'default'
                : row.original.status === 'FAILED'
                ? 'destructive'
                : 'neutral'
            }
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        header: _(msg`Retries`),
        accessorKey: 'retried',
        cell: ({ row }: { row: { original: any } }) =>
          `${row.original.retried} / ${row.original.maxRetries}`,
      },
      {
        header: _(msg`Submitted At`),
        accessorKey: 'submittedAt',
        cell: ({ row }: { row: { original: any } }) => i18n.date(row.original.submittedAt),
      },
      {
        header: _(msg`Tasks`),
        cell: ({ row }: { row: { original: any } }) => {
          const tasks = row.original.tasks || [];
          const completed = tasks.filter((task: any) => task.status === 'COMPLETED').length;
          return `${completed} / ${tasks.length}`;
        },
      },
      {
        id: 'actions',
        cell: ({ row }: { row: { original: any } }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => retryJob({ id: row.original.id })}
            disabled={isRetrying || row.original.status === 'PROCESSING'}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [_, i18n, isRetrying, retryJob],
  );

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  const selectedIds = Object.keys(rowSelection);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          <Trans>Background Jobs</Trans>
        </h2>
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => bulkDelete({ ids: selectedIds })}
            disabled={isDeleting}
          >
            <Trash className="mr-2 h-4 w-4" />
            <Trans>Delete Selected ({selectedIds.length})</Trans>
          </Button>
        )}
      </div>
      <DataTable
        columns={columns as any}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={(page, perPage) => updateSearchParams({ page, perPage })}
        skeleton={{ enable: isLoading, rows: 5 }}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
      >
        {(table) => <DataTablePagination table={table} />}
      </DataTable>
    </div>
  );
}
