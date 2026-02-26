import { useMemo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { Badge } from '@documenso/ui/primitives/badge';
import { RotateCcw } from 'lucide-react';

export default function AdminJobsPage() {
  const { t, i18n } = useLingui();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, refetch } = trpc.admin.job.findAll.useQuery({
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
  });

  const { mutate: retryJob, isPending: isRetrying } = trpc.admin.job.retry.useMutation({
    onSuccess: () => {
      toast({ title: t`Job marked for retry` });
      void refetch();
    },
    onError: () => {
      toast({ title: t`Failed to retry job`, variant: 'destructive' });
    },
  });

  const columns = useMemo(
    () => [
      {
        header: t`Name`,
        accessorKey: 'name',
      },
      {
        header: t`Status`,
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
        header: t`Retries`,
        accessorKey: 'retried',
        cell: ({ row }: { row: { original: any } }) =>
          `${row.original.retried} / ${row.original.maxRetries}`,
      },
      {
        header: t`Submitted At`,
        accessorKey: 'submittedAt',
        cell: ({ row }: { row: { original: any } }) => i18n.date(row.original.submittedAt),
      },
      {
        header: t`Tasks`,
        cell: ({ row }: { row: { original: any } }) => {
          const tasks = row.original.tasks || [];
          const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length;
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
    [t, i18n, isRetrying, retryJob],
  );

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold"><Trans>Background Jobs</Trans></h2>
      <DataTable
        columns={columns as any}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={(page, perPage) => updateSearchParams({ page, perPage })}
        skeleton={{ enable: isLoading, rows: 5 }}
      >
        {(table) => <DataTablePagination table={table} />}
      </DataTable>
    </div>
  );
}
