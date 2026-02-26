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

export default function AdminWebhooksPage() {
  const { t, i18n } = useLingui();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, refetch } = trpc.admin.webhook.findAllCalls.useQuery({
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
  });

  const { mutate: retryWebhook, isPending: isRetrying } = trpc.admin.webhook.retryCall.useMutation({
    onSuccess: () => {
      toast({ title: t`Webhook resent successfully` });
      void refetch();
    },
    onError: () => {
      toast({ title: t`Failed to resend webhook`, variant: 'destructive' });
    },
  });

  const columns = useMemo(
    () => [
      {
        header: t`Team`,
        cell: ({ row }: { row: { original: any } }) => row.original.webhook?.team?.name || 'N/A',
      },
      {
        header: t`URL`,
        accessorKey: 'url',
      },
      {
        header: t`Event`,
        accessorKey: 'event',
      },
      {
        header: t`Status`,
        accessorKey: 'status',
        cell: ({ row }: { row: { original: any } }) => (
          <Badge variant={row.original.status === 'SUCCESS' ? 'default' : 'destructive'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        header: t`Code`,
        accessorKey: 'responseCode',
      },
      {
        header: t`Called At`,
        accessorKey: 'createdAt',
        cell: ({ row }: { row: { original: any } }) => i18n.date(row.original.createdAt),
      },
      {
        id: 'actions',
        cell: ({ row }: { row: { original: any } }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => retryWebhook({ webhookCallId: row.original.id })}
            disabled={isRetrying}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [t, i18n, isRetrying, retryWebhook],
  );

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold"><Trans>Global Webhook Calls</Trans></h2>
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
