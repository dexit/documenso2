import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { MailIcon, UserPlusIcon } from 'lucide-react';

import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import type { DataTableColumnDef } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { Input } from '@documenso/ui/primitives/input';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';

import { AdminEmailsTable } from '~/components/tables/admin-emails-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Email Logs`);
}

const TYPE_LABELS: Record<string, string> = {
  signup_confirmation: 'Signup Confirmation',
  password_reset: 'Password Reset',
  password_changed: 'Password Changed',
  other: 'Other',
};

function SystemEmailsPanel() {
  const { _ } = useLingui();
  const [emailFilter, setEmailFilter] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 50;

  const debouncedEmail = useDebouncedValue(emailFilter, 400);

  const { data, isLoading } = trpc.admin.systemEmailLogs.get.useQuery(
    { page, perPage, emailFilter: debouncedEmail || undefined },
    { refetchInterval: 30_000, placeholderData: (prev) => prev },
  );

  type Entry = NonNullable<typeof data>['entries'][number];

  const columns = useMemo(
    () =>
      [
        {
          header: _(msg`Sent At`),
          accessorKey: 'createdAt',
          cell: ({ row }) => (
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleString()}
            </span>
          ),
        },
        {
          header: _(msg`Type`),
          accessorKey: 'type',
          cell: ({ row }) => (
            <Badge variant="secondary" className="text-xs">
              {TYPE_LABELS[row.original.type] ?? row.original.type}
            </Badge>
          ),
        },
        {
          header: _(msg`Recipient`),
          accessorKey: 'recipientEmail',
          cell: ({ row }) => (
            <div>
              <p className="text-xs font-medium">{row.original.recipientEmail}</p>
              {row.original.recipientName && (
                <p className="text-xs text-muted-foreground">{row.original.recipientName}</p>
              )}
            </div>
          ),
        },
        {
          header: _(msg`Subject`),
          accessorKey: 'subject',
          cell: ({ row }) => (
            <span className="max-w-xs truncate text-xs" title={row.original.subject}>
              {row.original.subject}
            </span>
          ),
        },
      ] satisfies DataTableColumnDef<Entry>[],
    [_],
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          type="search"
          placeholder={_(msg`Filter by email...`)}
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.entries ?? []}
        perPage={perPage}
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        onPaginationChange={(p) => setPage(p)}
        skeleton={{
          enable: isLoading,
          rows: 6,
          component: (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <TableCell key={i}>
                  <Skeleton className="h-4 w-24 rounded" />
                </TableCell>
              ))}
            </>
          ),
        }}
      >
        {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
      </DataTable>
    </div>
  );
}

export default function AdminEmailLogsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <MailIcon className="h-8 w-8 text-muted-foreground" />
        <div>
          <h2 className="text-4xl font-semibold">
            <Trans>Email Logs</Trans>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans>
              All outbound emails. Document emails include open-tracking and resend actions.
            </Trans>
          </p>
        </div>
      </div>

      <Tabs defaultValue="document">
        <TabsList className="mb-4">
          <TabsTrigger value="document">
            <MailIcon className="mr-1.5 h-4 w-4" />
            <Trans>Document emails</Trans>
          </TabsTrigger>
          <TabsTrigger value="system">
            <UserPlusIcon className="mr-1.5 h-4 w-4" />
            <Trans>System emails</Trans>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="document">
          <AdminEmailsTable />
        </TabsContent>

        <TabsContent value="system">
          <p className="mb-4 text-sm text-muted-foreground">
            <Trans>
              Signup confirmations and password reset emails. Stored in-memory — resets on server
              restart.
            </Trans>
          </p>
          <SystemEmailsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
