import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Loader, RotateCcw, Trash2 } from 'lucide-react';
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
import { useToast } from '@documenso/ui/primitives/use-toast';

type WebhookRow = RouterOutputs['admin']['webhook']['findAllCalls']['data'][number];

export default function AdminWebhooksPage() {
  const { t, i18n, _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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

  const { mutateAsync: bulkDeleteWebhookCalls, isPending: isBulkDeleting } =
    trpc.admin.webhook.bulkDeleteCalls.useMutation();

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

    if (!confirm(_(msg`Are you sure you want to delete ${selectedIds.length} webhook calls?`))) {
      return;
    }

    try {
      const result = await bulkDeleteWebhookCalls({ ids: selectedIds });
      toast({
        title: _(msg`Webhook calls deleted`),
        description: _(msg`Successfully deleted ${result.deletedCount} webhook calls.`),
      });
      setRowSelection({});
      navigate('.', { replace: true });
    } catch (err) {
      toast({
        title: _(msg`Error`),
        description: _(msg`Failed to delete webhook calls.`),
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
        header: t`Team`,
        cell: ({ row }: { row: { original: WebhookRow } }) =>
          row.original.webhook?.team?.name ?? <Trans>N/A</Trans>,
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
        cell: ({ row }: { row: { original: WebhookRow } }) => (
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
        cell: ({ row }: { row: { original: WebhookRow } }) => i18n.date(row.original.createdAt),
      },
      {
        id: 'actions',
        cell: ({ row }: { row: { original: WebhookRow } }) => (
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.locale, isRetrying, retryWebhook, _],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h2 className="text-2xl font-semibold">
          <Trans>Global Webhook Calls</Trans>
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
