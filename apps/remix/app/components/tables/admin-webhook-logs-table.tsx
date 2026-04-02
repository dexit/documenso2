import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2Icon, XCircleIcon } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { trpc } from '@documenso/trpc/react';
import type { TWebhookCallRow } from '@documenso/trpc/server/admin-router/find-webhook-logs.types';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { DataTable } from '@documenso/ui/primitives/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import { Input } from '@documenso/ui/primitives/input';

export function AdminWebhookLogsTable() {
  const { _, i18n } = useLingui();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const page = Number(searchParams.get('wp')) || 1;
  const perPage = Number(searchParams.get('wpp')) || 25;
  const status = (searchParams.get('ws') as 'SUCCESS' | 'FAILED' | '') || '';
  const query = searchParams.get('wq') || '';

  const [localQuery, setLocalQuery] = useState(query);

  const { data, isLoading } = trpc.admin.webhook.findLogs.useQuery({
    page,
    perPage,
    status: status || undefined,
    query: query || undefined,
  });

  const columns = useMemo<ColumnDef<TWebhookCallRow>[]>(
    () => [
      {
        header: _(msg`Status`),
        accessorKey: 'status',
        cell: ({ row }) =>
          row.original.status === 'SUCCESS' ? (
            <Badge variant="default" className="gap-1 text-xs">
              <CheckCircle2Icon className="h-3 w-3" />
              <Trans>Success</Trans>
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1 text-xs">
              <XCircleIcon className="h-3 w-3" />
              <Trans>Failed</Trans>
            </Badge>
          ),
      },
      {
        header: _(msg`Event`),
        accessorKey: 'event',
        cell: ({ row }) => <Badge variant="secondary" className="text-xs">{row.original.event}</Badge>,
      },
      {
        header: _(msg`URL`),
        accessorKey: 'webhookUrl',
        cell: ({ row }) => (
          <span className="max-w-[240px] truncate block text-xs font-mono">{row.original.webhookUrl}</span>
        ),
      },
      {
        header: _(msg`Response`),
        accessorKey: 'responseCode',
        cell: ({ row }) => {
          const code = row.original.responseCode;
          const variant = code >= 200 && code < 300 ? 'default' : 'destructive';
          return <Badge variant={variant} className="text-xs">{code}</Badge>;
        },
      },
      {
        header: _(msg`Team`),
        accessorKey: 'teamName',
        cell: ({ row }) => row.original.teamName ?? <span className="text-muted-foreground text-xs"><Trans>Personal</Trans></span>,
      },
      {
        header: _(msg`Owner`),
        accessorKey: 'ownerEmail',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-medium">{row.original.ownerName}</p>
            <p className="text-muted-foreground">{row.original.ownerEmail}</p>
          </div>
        ),
      },
      {
        header: _(msg`Time`),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {i18n.date(row.original.createdAt, { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: _(msg`Details`),
        cell: ({ row }) => (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <Trans>View</Trans>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle><Trans>Webhook Call Details</Trans></DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground mb-1"><Trans>Request Body</Trans></p>
                  <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(row.original.requestBody, null, 2)}
                  </pre>
                </div>
                {row.original.responseBody != null && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1"><Trans>Response Body</Trans></p>
                    <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                      {JSON.stringify(row.original.responseBody, null, 2)}
                    </pre>
                  </div>
                )}
                {row.original.responseHeaders != null && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1"><Trans>Response Headers</Trans></p>
                    <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-48 whitespace-pre-wrap">
                      {JSON.stringify(row.original.responseHeaders, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ),
      },
    ],
    [_, i18n],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={_(msg`Search URL or team...`)}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateSearchParams({ wq: localQuery || null, wp: '1' });
          }}
          className="h-8 w-48 text-sm"
        />
        <select
          className="h-8 rounded border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(e) => updateSearchParams({ ws: e.target.value || null, wp: '1' })}
        >
          <option value="">{_(msg`All Statuses`)}</option>
          <option value="SUCCESS">{_(msg`Success`)}</option>
          <option value="FAILED">{_(msg`Failed`)}</option>
        </select>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => updateSearchParams({ wq: localQuery || null, wp: '1' })}
        >
          <Trans>Search</Trans>
        </Button>
        {(query || status) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setLocalQuery('');
              updateSearchParams({ wq: null, ws: null, wp: '1' });
            }}
          >
            <Trans>Clear</Trans>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        perPage={perPage}
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        onPaginationChange={(p, pp) => updateSearchParams({ wp: String(p), wpp: String(pp) })}
        error={{ enable: false }}
        skeleton={{ enable: isLoading, rows: 5 }}
      />
    </div>
  );
}
