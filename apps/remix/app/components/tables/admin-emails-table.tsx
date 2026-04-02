import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DateTime } from 'luxon';
import {
  CheckCircle2Icon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  EyeIcon,
  MailOpenIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc } from '@documenso/trpc/react';
import type { TEmailActivityEntry } from '@documenso/trpc/server/admin-router/find-email-activity.types';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import type { DataTableColumnDef } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { Input } from '@documenso/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@documenso/ui/primitives/tooltip';
import { useToast } from '@documenso/ui/primitives/use-toast';

type ResendState = {
  envelopeId: string;
  recipientId: number;
  recipientEmail: string;
  documentTitle: string;
};

export const AdminEmailsTable = () => {
  const { _, i18n } = useLingui();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const [queryRaw, setQueryRaw] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [perPage, setPerPage] = useState(50);
  const [resendState, setResendState] = useState<ResendState | null>(null);

  const query = useDebouncedValue(queryRaw, 400);
  const parsedParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, isLoadingError } = trpc.admin.document.findEmailActivity.useQuery(
    {
      query: query || undefined,
      page: parsedParams.page,
      perPage,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      orderByDirection: sortDir,
    },
    { placeholderData: (prev) => prev },
  );

  const { mutate: resendEmail, isPending: isResending } =
    trpc.admin.document.resendEmail.useMutation({
      onSuccess: () => {
        toast({ title: _(msg`Email re-sent`) });
        setResendState(null);
      },
      onError: () => toast({ title: _(msg`Resend failed`), variant: 'destructive' }),
    });

  const { mutate: exportCsv, isPending: isExporting } =
    trpc.admin.document.exportActivityLogs.useMutation({
      onSuccess: ({ csv, filename }) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        toast({ title: _(msg`Export downloaded`) });
      },
      onError: () => toast({ title: _(msg`Export failed`), variant: 'destructive' }),
    });

  const stats = data?.stats ?? { totalSent: 0, totalOpened: 0, openRate: 0 };
  const results = data ?? { data: [], perPage: 50, currentPage: 1, totalPages: 1 };

  const columns = useMemo(
    () =>
      [
        {
          id: 'sent',
          header: _(msg`Sent At`),
          accessorKey: 'sentAt',
          cell: ({ row }) => (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {i18n.date(row.original.sentAt, { ...DateTime.DATETIME_SHORT, hourCycle: 'h12' })}
            </span>
          ),
        },
        {
          id: 'status',
          header: _(msg`Status`),
          cell: ({ row }) => {
            const { openCount } = row.original;
            if (openCount > 0) {
              return (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <MailOpenIcon className="h-3.5 w-3.5" />
                  <span>
                    <Trans>Opened</Trans>
                    {openCount > 1 && ` ×${openCount}`}
                  </span>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <EyeIcon className="h-3.5 w-3.5" />
                <Trans>Not opened</Trans>
              </div>
            );
          },
        },
        {
          id: 'document',
          header: _(msg`Document`),
          cell: ({ row }) =>
            row.original.documentId ? (
              <Link
                to={`/admin/documents/${row.original.documentId}`}
                className="flex max-w-[12rem] items-center gap-1 truncate font-medium hover:underline"
              >
                <span className="truncate">{row.original.documentTitle}</span>
                <ExternalLinkIcon className="h-3 w-3 shrink-0" />
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'recipient',
          header: _(msg`Recipient`),
          cell: ({ row }) => (
            <div className="text-sm">
              {row.original.recipientName && (
                <p className="font-medium">{row.original.recipientName}</p>
              )}
              <p className="text-xs text-muted-foreground">{row.original.recipientEmail}</p>
            </div>
          ),
        },
        {
          id: 'emailType',
          header: _(msg`Email Type`),
          cell: ({ row }) => {
            const type = row.original.emailType.replace(/_/g, ' ');
            const isResend = row.original.isResending;
            return (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">{type}</Badge>
                {isResend && <Badge variant="neutral" className="text-xs"><Trans>Reminder</Trans></Badge>}
              </div>
            );
          },
        },
        {
          id: 'sender',
          header: _(msg`Sender`),
          cell: ({ row }) =>
            row.original.senderName || row.original.senderEmail ? (
              <div className="text-xs">
                {row.original.senderName && <p>{row.original.senderName}</p>}
                {row.original.senderEmail && (
                  <p className="text-muted-foreground">{row.original.senderEmail}</p>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'team',
          header: _(msg`Team`),
          cell: ({ row }) =>
            row.original.teamName ? (
              <span className="text-xs">{row.original.teamName}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'lastOpened',
          header: _(msg`Last Opened`),
          cell: ({ row }) =>
            row.original.lastOpenedAt ? (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2Icon className="h-3 w-3" />
                {i18n.date(row.original.lastOpenedAt, DateTime.DATE_MED)}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            ),
        },
        {
          id: 'actions',
          header: '',
          cell: ({ row }) => {
            const entry = row.original;
            return (
              <div className="flex items-center gap-1">
                {/* Signing link */}
                {entry.signingLink && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" asChild>
                          <a href={entry.signingLink} target="_blank" rel="noreferrer">
                            <ExternalLinkIcon className="h-3 w-3" />
                            <Trans>Sign</Trans>
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs break-all text-xs">{entry.signingLink}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {entry.signingLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      void navigator.clipboard.writeText(entry.signingLink!);
                      toast({ title: _(msg`Signing link copied`) });
                    }}
                  >
                    <CopyIcon className="h-3 w-3" />
                  </Button>
                )}

                {/* Resend */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() =>
                    setResendState({
                      envelopeId: entry.envelopeId,
                      recipientId: entry.recipientId,
                      recipientEmail: entry.recipientEmail,
                      documentTitle: entry.documentTitle,
                    })
                  }
                >
                  <RefreshCwIcon className="h-3 w-3" />
                  <Trans>Resend</Trans>
                </Button>
              </div>
            );
          },
        },
      ] satisfies DataTableColumnDef<TEmailActivityEntry>[],
    [_, i18n],
  );

  return (
    <>
      {/* Stats Banner */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground"><Trans>Emails Sent</Trans></p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.totalOpened.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground"><Trans>Emails Opened</Trans></p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.openRate}%</p>
          <p className="text-xs text-muted-foreground"><Trans>Open Rate</Trans></p>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          placeholder={_(msg`Search by document, name, email…`)}
          value={queryRaw}
          onChange={(e) => { setQueryRaw(e.target.value); updateSearchParams({ page: 1 }); }}
          className="h-8 w-64"
        />

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); updateSearchParams({ page: 1 }); }}
          className="h-8 w-36"
          title={_(msg`From date`)}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); updateSearchParams({ page: 1 }); }}
          className="h-8 w-36"
          title={_(msg`To date`)}
        />

        <Select value={sortDir} onValueChange={(v) => setSortDir(v as 'asc' | 'desc')}>
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc"><Trans>Newest first</Trans></SelectItem>
            <SelectItem value="asc"><Trans>Oldest first</Trans></SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); updateSearchParams({ page: 1 }); }}>
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 gap-1 text-xs"
          loading={isExporting}
          onClick={() =>
            exportCsv({
              type: 'EMAIL_SENT',
              dateFrom: dateFrom || undefined,
              dateTo: dateTo || undefined,
            })
          }
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          <Trans>Export CSV</Trans>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={(page, pp) => updateSearchParams({ page, perPage: pp })}
        error={{ enable: isLoadingError }}
        skeleton={{
          enable: isLoading,
          rows: 5,
          component: (
            <>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-8 w-28" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-7 w-24" /></TableCell>
            </>
          ),
        }}
      >
        {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
      </DataTable>

      {/* Resend Dialog */}
      <Dialog open={resendState !== null} onOpenChange={() => setResendState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><Trans>Re-send Email</Trans></DialogTitle>
            <DialogDescription>
              {resendState && (
                <Trans>
                  Re-send the signing email for <strong>{resendState.documentTitle}</strong> to{' '}
                  <strong>{resendState.recipientEmail}</strong>.
                </Trans>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResendState(null)}><Trans>Cancel</Trans></Button>
            <Button
              loading={isResending}
              onClick={() =>
                resendState &&
                resendEmail({ envelopeId: resendState.envelopeId, recipientId: resendState.recipientId })
              }
            >
              <Trans>Re-send</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
