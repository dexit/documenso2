import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DateTime } from 'luxon';
import type { DateTimeFormatOptions } from 'luxon';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LayoutListIcon,
  MailIcon,
  RefreshCwIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import type { TDocumentAuditLogType } from '@documenso/lib/types/document-audit-logs';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { formatDocumentAuditLogAction } from '@documenso/lib/utils/document-audit-logs';
import { trpc } from '@documenso/trpc/react';
import type { TActivityLogWithEnvelope } from '@documenso/trpc/server/admin-router/find-all-activity-logs.types';
import { CopyTextButton } from '@documenso/ui/components/common/copy-text-button';
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
import { Label } from '@documenso/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';
import { Textarea } from '@documenso/ui/primitives/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@documenso/ui/primitives/tooltip';
import { useToast } from '@documenso/ui/primitives/use-toast';

const dateFormat: DateTimeFormatOptions = { ...DateTime.DATETIME_SHORT, hourCycle: 'h12' };

type SortCol = 'createdAt' | 'type' | 'email';
type GroupMode = 'flat' | 'byRecipient' | 'byDocument' | 'byType';

type ResendState = {
  envelopeId: string;
  recipientId: number;
  recipientEmail: string;
  documentTitle: string;
};

type EditMetaState = {
  envelopeId: string;
  documentTitle: string;
};

const TYPE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'neutral' | 'destructive' | 'warning' | 'orange'; className?: string }> = {
  [DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT]: { label: 'Email Sent', variant: 'default', className: 'bg-blue-600 text-white' },
  [DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED]: { label: 'Email Opened', variant: 'default', className: 'bg-cyan-600 text-white' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT]: { label: 'Sign Request', variant: 'secondary' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED]: { label: 'Doc Opened', variant: 'neutral' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_VIEWED]: { label: 'Doc Viewed', variant: 'neutral' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_COMPLETED]: { label: 'Completed', variant: 'default', className: 'bg-green-600 text-white' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED]: { label: 'Signed', variant: 'default', className: 'bg-green-500 text-white' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_REJECTED]: { label: 'Rejected', variant: 'destructive' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_CREATED]: { label: 'Created', variant: 'secondary' },
  [DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_DELETED]: { label: 'Deleted', variant: 'destructive' },
};

function getTypeBadge(type: string) {
  const cfg = TYPE_BADGE[type];
  if (cfg) {
    return (
      <Badge variant={cfg.variant} className={`text-xs ${cfg.className ?? ''}`}>
        {cfg.label}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="max-w-[10rem] truncate text-xs">
      {type.replace(/_/g, ' ')}
    </Badge>
  );
}

function SortButton({ col, current, dir, onSort }: { col: SortCol; current: SortCol; dir: 'asc' | 'desc'; onSort: (c: SortCol) => void }) {
  const active = col === current;
  const Icon = active ? (dir === 'asc' ? ArrowUpIcon : ArrowDownIcon) : ArrowUpDownIcon;
  return (
    <button onClick={() => onSort(col)} className="ml-1 inline-flex opacity-60 hover:opacity-100">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

type GroupedSection = { key: string; label: string; rows: TActivityLogWithEnvelope[] };

function groupLogs(logs: TActivityLogWithEnvelope[], mode: GroupMode): GroupedSection[] {
  if (mode === 'flat') return [{ key: 'all', label: '', rows: logs }];

  const map = new Map<string, TActivityLogWithEnvelope[]>();

  logs.forEach((log) => {
    let key = '';
    if (mode === 'byRecipient') key = log.email ?? 'unknown';
    else if (mode === 'byDocument') key = log.envelope?.id ?? 'unknown';
    else if (mode === 'byType') key = log.type;

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  });

  return Array.from(map.entries()).map(([key, rows]) => {
    let label = key;
    if (mode === 'byDocument') label = rows[0]?.envelope?.title ?? key;
    else if (mode === 'byType') label = key.replace(/_/g, ' ');
    return { key, label, rows };
  });
}

export const AdminActivityLogsTable = () => {
  const { _, i18n } = useLingui();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const [selectedLog, setSelectedLog] = useState<TActivityLogWithEnvelope | null>(null);
  const [resendState, setResendState] = useState<ResendState | null>(null);
  const [editMetaState, setEditMetaState] = useState<EditMetaState | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editMessage, setEditMessage] = useState('');

  const [typeFilter, setTypeFilter] = useState<TDocumentAuditLogType | ''>('');
  // Pre-populate email filter from URL ?email= param (used by "View activity" link from recipients)
  const [emailFilter, setEmailFilter] = useState(() => searchParams.get('email') ?? '');
  const [queryFilter, setQueryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [groupMode, setGroupMode] = useState<GroupMode>('flat');
  const [perPage, setPerPage] = useState(50);

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, isLoadingError } = trpc.admin.document.findAllActivityLogs.useQuery(
    {
      page: parsedSearchParams.page,
      perPage,
      type: typeFilter || undefined,
      email: emailFilter || undefined,
      query: queryFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      orderByColumn: sortCol,
      orderByDirection: sortDir,
    },
    { placeholderData: (prev) => prev },
  );

  const { mutate: resendEmail, isPending: isResending } =
    trpc.admin.document.resendEmail.useMutation({
      onSuccess: () => {
        toast({ title: _(msg`Email re-sent successfully`) });
        setResendState(null);
      },
      onError: () =>
        toast({ title: _(msg`Failed to resend`), variant: 'destructive' }),
    });

  const { mutate: updateMeta, isPending: isUpdatingMeta } =
    trpc.admin.document.updateDocumentMeta.useMutation({
      onSuccess: () => {
        toast({ title: _(msg`Email settings updated`) });
        setEditMetaState(null);
      },
      onError: () =>
        toast({ title: _(msg`Update failed`), variant: 'destructive' }),
    });

  const { mutate: exportCsv, isPending: isExporting } =
    trpc.admin.document.exportActivityLogs.useMutation({
      onSuccess: ({ csv, filename }) => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: _(msg`Export downloaded`) });
      },
      onError: () =>
        toast({ title: _(msg`Export failed`), variant: 'destructive' }),
    });

  const handleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
    updateSearchParams({ page: 1 });
  };

  const clearFilters = () => {
    setTypeFilter('');
    setEmailFilter('');
    setQueryFilter('');
    setDateFrom('');
    setDateTo('');
    updateSearchParams({ page: 1 });
  };

  const hasFilters = !!(typeFilter || emailFilter || queryFilter || dateFrom || dateTo);

  const results = data ?? { data: [], perPage: 50, currentPage: 1, totalPages: 1 };

  const grouped = useMemo(() => groupLogs(results.data, groupMode), [results.data, groupMode]);

  const columns = useMemo(
    () =>
      [
        {
          id: 'time',
          header: () => (
            <span>
              <Trans>Time</Trans>
              <SortButton col="createdAt" current={sortCol} dir={sortDir} onSort={handleSort} />
            </span>
          ),
          accessorKey: 'createdAt',
          cell: ({ row }) => (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {i18n.date(row.original.createdAt, dateFormat)}
            </span>
          ),
        },
        {
          id: 'type',
          header: () => (
            <span>
              <Trans>Type</Trans>
              <SortButton col="type" current={sortCol} dir={sortDir} onSort={handleSort} />
            </span>
          ),
          accessorKey: 'type',
          cell: ({ row }) => getTypeBadge(row.original.type),
        },
        {
          id: 'team',
          header: _(msg`Team`),
          cell: ({ row }) =>
            row.original.envelope?.team?.name ? (
              <span className="text-xs">{row.original.envelope.team.name}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'document',
          header: _(msg`Document`),
          cell: ({ row }) =>
            row.original.envelope ? (
              <Link
                to={`/admin/documents/${row.original.envelope.id}`}
                className="flex max-w-[12rem] items-center gap-1 truncate font-medium hover:underline"
              >
                <span className="truncate">{row.original.envelope.title}</span>
                <ExternalLinkIcon className="h-3 w-3 shrink-0" />
              </Link>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
        {
          id: 'recipient',
          header: () => (
            <span>
              <Trans>Recipient</Trans>
              <SortButton col="email" current={sortCol} dir={sortDir} onSort={handleSort} />
            </span>
          ),
          cell: ({ row }) => {
            const log = row.original;
            const emailData =
              log.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT ||
              log.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED
                ? (log.data as { recipientEmail?: string; recipientName?: string })
                : null;
            const displayEmail = emailData?.recipientEmail ?? log.email;
            const displayName = emailData?.recipientName ?? log.name;
            return displayEmail || displayName ? (
              <div className="text-sm">
                {displayName && <p className="font-medium">{displayName}</p>}
                {displayEmail && <p className="text-xs text-muted-foreground">{displayEmail}</p>}
              </div>
            ) : (
              <span className="text-muted-foreground">—</span>
            );
          },
        },
        {
          id: 'action',
          header: _(msg`Action`),
          cell: ({ row }) => (
            <span className="max-w-[18rem] truncate text-sm">
              {formatDocumentAuditLogAction(i18n, row.original).description}
            </span>
          ),
        },
        {
          id: 'actions',
          header: '',
          cell: ({ row }) => {
            const log = row.original;
            const isEmailLog = log.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT;
            const emailData = isEmailLog
              ? (log.data as { recipientId?: number; recipientEmail?: string })
              : null;

            return (
              <div className="flex items-center gap-1">
                {/* Signing link */}
                {log.signingLink && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" asChild>
                          <a href={log.signingLink} target="_blank" rel="noreferrer">
                            <ExternalLinkIcon className="h-3 w-3" />
                            <Trans>Sign</Trans>
                          </a>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs break-all text-xs">{log.signingLink}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {/* Copy signing link */}
                {log.signingLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      void navigator.clipboard.writeText(log.signingLink!);
                      toast({ title: _(msg`Signing link copied`) });
                    }}
                  >
                    <CopyIcon className="h-3 w-3" />
                  </Button>
                )}

                {/* Resend */}
                {isEmailLog && log.envelope && emailData?.recipientId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() =>
                      setResendState({
                        envelopeId: log.envelope!.id,
                        recipientId: emailData.recipientId!,
                        recipientEmail: emailData.recipientEmail ?? '',
                        documentTitle: log.envelope!.title,
                      })
                    }
                  >
                    <RefreshCwIcon className="h-3 w-3" />
                    <Trans>Resend</Trans>
                  </Button>
                )}

                {/* Edit message */}
                {log.envelope && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      setEditMetaState({
                        envelopeId: log.envelope!.id,
                        documentTitle: log.envelope!.title,
                      });
                      setEditSubject('');
                      setEditMessage('');
                    }}
                  >
                    <SettingsIcon className="h-3 w-3" />
                    <Trans>Edit</Trans>
                  </Button>
                )}

                {/* JSON viewer */}
                <Button
                  variant="link"
                  size="sm"
                  className="h-7 px-1 text-xs"
                  onClick={() => setSelectedLog(log)}
                >
                  JSON
                </Button>
              </div>
            );
          },
        },
      ] satisfies DataTableColumnDef<(typeof results)['data'][number]>[],
    [_, i18n, sortCol, sortDir],
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 space-y-3">
        {/* Row 1: search + type filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder={_(msg`Search title, name, email…`)}
            value={queryFilter}
            onChange={(e) => { setQueryFilter(e.target.value); updateSearchParams({ page: 1 }); }}
            className="h-8 w-64"
          />

          <Select
            value={typeFilter}
            onValueChange={(v) => { setTypeFilter(v as TDocumentAuditLogType | ''); updateSearchParams({ page: 1 }); }}
          >
            <SelectTrigger className="h-8 w-52">
              <SelectValue placeholder={_(msg`Filter by type…`)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=""><Trans>All types</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT}><Trans>Email Sent</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED}><Trans>Email Opened</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT}><Trans>Sign Request</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED}><Trans>Doc Opened</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_VIEWED}><Trans>Doc Viewed</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_COMPLETED}><Trans>Completed</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED}><Trans>Recipient Completed</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_REJECTED}><Trans>Rejected</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_CREATED}><Trans>Created</Trans></SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_DELETED}><Trans>Deleted</Trans></SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="search"
            placeholder={_(msg`Filter by email…`)}
            value={emailFilter}
            onChange={(e) => { setEmailFilter(e.target.value); updateSearchParams({ page: 1 }); }}
            className="h-8 w-52"
          />
        </div>

        {/* Row 2: date range + grouping + per-page + export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground"><Trans>From</Trans></Label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); updateSearchParams({ page: 1 }); }} className="h-8 w-36" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground"><Trans>To</Trans></Label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); updateSearchParams({ page: 1 }); }} className="h-8 w-36" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Group mode */}
            <div className="flex rounded-md border">
              {([
                ['flat', <LayoutListIcon className="h-3.5 w-3.5" />, msg`Flat`],
                ['byRecipient', <UsersIcon className="h-3.5 w-3.5" />, msg`By Recipient`],
                ['byDocument', <ExternalLinkIcon className="h-3.5 w-3.5" />, msg`By Document`],
                ['byType', <MailIcon className="h-3.5 w-3.5" />, msg`By Type`],
              ] as const).map(([mode, icon, label]) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  className={`h-8 rounded-none px-2 text-xs first:rounded-l-md last:rounded-r-md ${groupMode === mode ? 'bg-secondary' : ''}`}
                  onClick={() => setGroupMode(mode as GroupMode)}
                  title={_(label)}
                >
                  {icon}
                </Button>
              ))}
            </div>

            {/* Per-page */}
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); updateSearchParams({ page: 1 }); }}>
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                <Trans>Clear</Trans>
              </Button>
            )}

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              loading={isExporting}
              onClick={() =>
                exportCsv({
                  type: typeFilter || undefined,
                  email: emailFilter || undefined,
                  dateFrom: dateFrom || undefined,
                  dateTo: dateTo || undefined,
                })
              }
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              <Trans>Export CSV</Trans>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="mb-3 flex items-center gap-4 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
          <span><Trans>Total</Trans>: <strong className="text-foreground">{data.count}</strong></span>
          {typeFilter && <span><Trans>Type</Trans>: <strong className="text-foreground">{typeFilter.replace(/_/g, ' ')}</strong></span>}
          {groupMode !== 'flat' && <span><Trans>Grouped by</Trans>: <strong className="text-foreground">{groupMode.replace('by', '')}</strong></span>}
        </div>
      )}

      {/* Grouped sections */}
      {groupMode !== 'flat' ? (
        <div className="space-y-6">
          {grouped.map((section) => (
            <div key={section.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-semibold">{section.label || section.key}</span>
                <Badge variant="secondary" className="text-xs">{section.rows.length}</Badge>
              </div>
              <DataTable
                columns={columns}
                data={section.rows}
                perPage={section.rows.length}
                currentPage={1}
                totalPages={1}
                onPaginationChange={() => {}}
                error={{ enable: isLoadingError }}
              />
            </div>
          ))}
          {isLoading && <Skeleton className="h-32 w-full rounded-lg" />}
        </div>
      ) : (
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
                <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-7 w-24" /></TableCell>
              </>
            ),
          }}
        >
          {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
        </DataTable>
      )}

      {/* JSON Detail Dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle><Trans>Activity Log Details</Trans></DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="group relative">
              <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                <CopyTextButton
                  value={JSON.stringify(selectedLog, null, 2)}
                  onCopySuccess={() => toast({ title: _(msg`Copied to clipboard`) })}
                />
              </div>
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-all rounded-lg border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              onClick={() => resendState && resendEmail({ envelopeId: resendState.envelopeId, recipientId: resendState.recipientId })}
            >
              <Trans>Re-send</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Message Dialog */}
      <Dialog open={editMetaState !== null} onOpenChange={(open) => { if (!open) setEditMetaState(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><Trans>Edit Email Message</Trans></DialogTitle>
            <DialogDescription>
              {editMetaState && (
                <Trans>Update email subject and message for <strong>{editMetaState.documentTitle}</strong>.</Trans>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-subject"><Trans>Subject</Trans></Label>
              <Input id="edit-subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder={_(msg`Email subject…`)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-message"><Trans>Message</Trans></Label>
              <Textarea id="edit-message" value={editMessage} onChange={(e) => setEditMessage(e.target.value)} placeholder={_(msg`Email message…`)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditMetaState(null)}><Trans>Cancel</Trans></Button>
            <Button
              loading={isUpdatingMeta}
              onClick={() => editMetaState && updateMeta({ envelopeId: editMetaState.envelopeId, subject: editSubject || undefined, message: editMessage || undefined })}
            >
              <Trans>Save</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
