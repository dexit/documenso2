import { useMemo } from 'react';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
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
import { Eye, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';

export default function AdminEmailsPage() {
  const { _, i18n } = useLingui();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, refetch } = trpc.admin.email.find.useQuery({
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
  });

  const { mutate: retryEmail, isPending: isRetrying } = trpc.admin.email.retry.useMutation({
    onSuccess: () => {
      toast({ title: _(msg`Email resent successfully`) });
      void refetch();
    },
    onError: () => {
      toast({ title: _(msg`Failed to resend email`), variant: 'destructive' });
    },
  });

  const columns = useMemo(
    () => [
      {
        header: _(msg`To`),
        accessorKey: 'to',
      },
      {
        header: _(msg`Subject`),
        accessorKey: 'subject',
      },
      {
        header: _(msg`Status`),
        accessorKey: 'status',
        cell: ({ row }: { row: { original: any } }) => (
          <Badge variant={row.original.status === 'SENT' ? 'default' : 'neutral'}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        header: _(msg`Tracking`),
        cell: ({ row }: { row: { original: any } }) => {
          const interactions = row.original.interactions || [];
          const opens = interactions.filter((i: any) => i.type === 'OPEN').length;
          return (
            <div className="flex flex-col text-xs">
              <span>{_(msg`Opens`)}: {opens}</span>
              {row.original.deliveredAt && (
                <span className="text-green-600">{_(msg`Delivered`)}</span>
              )}
            </div>
          );
        },
      },
      {
        header: _(msg`Sent At`),
        accessorKey: 'createdAt',
        cell: ({ row }: { row: { original: any } }) => i18n.date(row.original.createdAt),
      },
      {
        id: 'actions',
        cell: ({ row }: { row: { original: any } }) => (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{row.original.subject}</DialogTitle>
                </DialogHeader>
                <div
                  className="prose prose-sm dark:prose-invert mt-4 border p-4 rounded-md bg-white text-black"
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
    [_, i18n, isRetrying, retryEmail],
  );

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold"><Trans>Emails</Trans></h2>
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
