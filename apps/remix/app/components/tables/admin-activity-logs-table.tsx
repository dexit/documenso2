import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DateTime } from 'luxon';
import type { DateTimeFormatOptions } from 'luxon';
import { ExternalLinkIcon, MailIcon, RefreshCwIcon, SettingsIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import type { TDocumentAuditLogType } from '@documenso/lib/types/document-audit-logs';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { formatDocumentAuditLogAction } from '@documenso/lib/utils/document-audit-logs';
import { trpc } from '@documenso/trpc/react';
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
import { useToast } from '@documenso/ui/primitives/use-toast';

import type { TActivityLogWithEnvelope } from '@documenso/trpc/server/admin-router/find-all-activity-logs.types';

const dateFormat: DateTimeFormatOptions = {
  ...DateTime.DATETIME_SHORT,
  hourCycle: 'h12',
};

const EMAIL_ACTIVITY_TYPES = new Set([
  DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
  DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT,
  DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED,
  DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_VIEWED,
]);

type ResendState = {
  envelopeId: string;
  recipientId: number;
  recipientEmail: string;
  documentTitle: string;
};

type EditMetaState = {
  envelopeId: string;
  documentTitle: string;
  currentSubject: string;
  currentMessage: string;
};

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
  const [emailFilter, setEmailFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<TDocumentAuditLogType | ''>('');

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, isLoadingError } = trpc.admin.document.findAllActivityLogs.useQuery(
    {
      page: parsedSearchParams.page,
      perPage: parsedSearchParams.perPage ?? 50,
      type: typeFilter || undefined,
      email: emailFilter || undefined,
    },
    {
      placeholderData: (previousData) => previousData,
    },
  );

  const { mutate: resendEmail, isPending: isResending } =
    trpc.admin.document.resendEmail.useMutation({
      onSuccess: () => {
        toast({
          title: _(msg`Email re-sent`),
          description: _(msg`The email has been re-sent to the recipient.`),
        });
        setResendState(null);
      },
      onError: () => {
        toast({
          title: _(msg`Failed to resend`),
          description: _(msg`Could not re-send the email. Please try again.`),
          variant: 'destructive',
        });
      },
    });

  const { mutate: updateMeta, isPending: isUpdatingMeta } =
    trpc.admin.document.updateDocumentMeta.useMutation({
      onSuccess: () => {
        toast({
          title: _(msg`Email settings updated`),
          description: _(msg`The document email subject and message have been updated.`),
        });
        setEditMetaState(null);
      },
      onError: () => {
        toast({
          title: _(msg`Update failed`),
          description: _(msg`Could not update the email settings. Please try again.`),
          variant: 'destructive',
        });
      },
    });

  const onPaginationChange = (page: number, perPage: number) => {
    updateSearchParams({ page, perPage });
  };

  const results = data ?? {
    data: [],
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  };

  const getActivityTypeBadge = (type: string) => {
    if (type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT) {
      return (
        <Badge variant="default" className="gap-1 text-xs">
          <MailIcon className="h-3 w-3" />
          <Trans>Email Sent</Trans>
        </Badge>
      );
    }

    if (type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Trans>Sign Request</Trans>
        </Badge>
      );
    }

    if (
      type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED ||
      type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_VIEWED
    ) {
      return (
        <Badge variant="outline" className="text-xs">
          <Trans>Email Opened</Trans>
        </Badge>
      );
    }

    if (type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_COMPLETED) {
      return (
        <Badge className="bg-green-600 text-xs text-white">
          <Trans>Completed</Trans>
        </Badge>
      );
    }

    if (type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED) {
      return (
        <Badge className="bg-green-500 text-xs text-white">
          <Trans>Signed</Trans>
        </Badge>
      );
    }

    if (type === DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_REJECTED) {
      return (
        <Badge variant="destructive" className="text-xs">
          <Trans>Rejected</Trans>
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="max-w-[12rem] truncate text-xs">
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const columns = useMemo(() => {
    return [
      {
        header: _(msg`Time`),
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {i18n.date(row.original.createdAt, dateFormat)}
          </span>
        ),
      },
      {
        header: _(msg`Type`),
        accessorKey: 'type',
        cell: ({ row }) => getActivityTypeBadge(row.original.type),
      },
      {
        header: _(msg`Document`),
        accessorKey: 'envelope',
        cell: ({ row }) =>
          row.original.envelope ? (
            <Link
              to={`/admin/documents/${row.original.envelope.id}`}
              className="flex items-center gap-1 font-medium hover:underline"
            >
              <span className="max-w-[10rem] truncate">{row.original.envelope.title}</span>
              <ExternalLinkIcon className="h-3 w-3 shrink-0" />
            </Link>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        header: _(msg`Recipient / User`),
        accessorKey: 'email',
        cell: ({ row }) => {
          const log = row.original;
          const emailData =
            log.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT ? (log.data as { recipientEmail?: string; recipientName?: string }) : null;

          const displayEmail = emailData?.recipientEmail ?? log.email;
          const displayName = emailData?.recipientName ?? log.name;

          return displayEmail || displayName ? (
            <div className="text-sm">
              {displayName && (
                <p className="font-medium">{displayName}</p>
              )}
              {displayEmail && (
                <p className="text-muted-foreground">{displayEmail}</p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        header: _(msg`Action`),
        accessorKey: 'description',
        cell: ({ row }) => (
          <span className="text-sm">
            {formatDocumentAuditLogAction(i18n, row.original).description}
          </span>
        ),
      },
      {
        header: '',
        id: 'actions',
        cell: ({ row }) => {
          const log = row.original;
          const isEmailLog = log.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT;
          const emailData = isEmailLog ? (log.data as { recipientId?: number; recipientEmail?: string }) : null;

          return (
            <div className="flex items-center gap-1">
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

              {log.envelope && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => {
                    setEditMetaState({
                      envelopeId: log.envelope!.id,
                      documentTitle: log.envelope!.title,
                      currentSubject: '',
                      currentMessage: '',
                    });
                    setEditSubject('');
                    setEditMessage('');
                  }}
                >
                  <SettingsIcon className="h-3 w-3" />
                  <Trans>Edit Msg</Trans>
                </Button>
              )}

              <Button
                variant="link"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSelectedLog(log)}
              >
                <Trans>JSON</Trans>
              </Button>
            </div>
          );
        },
      },
    ] satisfies DataTableColumnDef<(typeof results)['data'][number]>[];
  }, [_, i18n]);

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as TDocumentAuditLogType | '');
              updateSearchParams({ page: 1 });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={_(msg`Filter by type...`)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <Trans>All types</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT}>
                <Trans>Email Sent</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT}>
                <Trans>Document Sent (Sign Request)</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_OPENED}>
                <Trans>Document Opened</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_VIEWED}>
                <Trans>Document Viewed</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_COMPLETED}>
                <Trans>Document Completed</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED}>
                <Trans>Recipient Completed</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_REJECTED}>
                <Trans>Recipient Rejected</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_CREATED}>
                <Trans>Document Created</Trans>
              </SelectItem>
              <SelectItem value={DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_DELETED}>
                <Trans>Document Deleted</Trans>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-64">
          <Input
            type="search"
            placeholder={_(msg`Filter by email...`)}
            value={emailFilter}
            onChange={(e) => {
              setEmailFilter(e.target.value);
              updateSearchParams({ page: 1 });
            }}
          />
        </div>

        {(typeFilter || emailFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter('');
              setEmailFilter('');
              updateSearchParams({ page: 1 });
            }}
          >
            <Trans>Clear filters</Trans>
          </Button>
        )}
      </div>

      {/* Stats bar */}
      {data && (
        <div className="mb-4 flex items-center gap-4 rounded-lg border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <span>
            <Trans>Total activities</Trans>: <strong className="text-foreground">{data.count}</strong>
          </span>
          {typeFilter && (
            <span>
              <Trans>Filtered by</Trans>:{' '}
              <strong className="text-foreground">{typeFilter.replace(/_/g, ' ')}</strong>
            </span>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={onPaginationChange}
        error={{ enable: isLoadingError }}
        skeleton={{
          enable: isLoading,
          rows: 5,
          component: (
            <>
              <TableCell><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-28 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16 rounded-full" /></TableCell>
            </>
          ),
        }}
      >
        {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
      </DataTable>

      {/* JSON Detail Dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <Trans>Activity Log Details</Trans>
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="group relative">
              <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                <CopyTextButton
                  value={JSON.stringify(selectedLog, null, 2)}
                  onCopySuccess={() => toast({ title: _(msg`Copied to clipboard`) })}
                />
              </div>
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-foreground">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resend Email Confirmation Dialog */}
      <Dialog open={resendState !== null} onOpenChange={() => setResendState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>Re-send Email</Trans>
            </DialogTitle>
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
            <Button variant="secondary" onClick={() => setResendState(null)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button
              loading={isResending}
              onClick={() => {
                if (resendState) {
                  resendEmail({
                    envelopeId: resendState.envelopeId,
                    recipientId: resendState.recipientId,
                  });
                }
              }}
            >
              <Trans>Re-send</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Message Dialog */}
      <Dialog
        open={editMetaState !== null}
        onOpenChange={(open) => {
          if (!open) setEditMetaState(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans>Edit Email Message</Trans>
            </DialogTitle>
            <DialogDescription>
              {editMetaState && (
                <Trans>
                  Update the email subject and message for{' '}
                  <strong>{editMetaState.documentTitle}</strong>.
                </Trans>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject">
                <Trans>Email Subject</Trans>
              </Label>
              <Input
                id="edit-subject"
                placeholder={_(msg`Enter email subject...`)}
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-message">
                <Trans>Email Message</Trans>
              </Label>
              <Textarea
                id="edit-message"
                placeholder={_(msg`Enter email message...`)}
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditMetaState(null)}>
              <Trans>Cancel</Trans>
            </Button>
            <Button
              loading={isUpdatingMeta}
              onClick={() => {
                if (editMetaState) {
                  updateMeta({
                    envelopeId: editMetaState.envelopeId,
                    subject: editSubject || undefined,
                    message: editMessage || undefined,
                  });
                }
              }}
            >
              <Trans>Save Changes</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
