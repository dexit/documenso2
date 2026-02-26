import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import {
  CreditCardIcon,
  ExternalLinkIcon,
  Loader,
  MoreHorizontalIcon,
  SettingsIcon,
  Trash2,
  UserIcon,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { SUBSCRIPTION_STATUS_MAP } from '@documenso/lib/constants/billing';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import type { DataTableColumnDef, RowSelectionState } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';
import { useToast } from '@documenso/ui/primitives/use-toast';

type AdminOrganisationsTableOptions = {
  ownerUserId?: number;
  memberUserId?: number;
  showOwnerColumn?: boolean;
  hidePaginationUntilOverflow?: boolean;
};

export const AdminOrganisationsTable = ({
  ownerUserId,
  memberUserId,
  showOwnerColumn = true,
  hidePaginationUntilOverflow,
}: AdminOrganisationsTableOptions) => {
  const { t, i18n, _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, isLoadingError } = trpc.admin.organisation.find.useQuery({
    query: parsedSearchParams.query,
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
    ownerUserId,
    memberUserId,
  });

  const { mutateAsync: bulkDeleteOrganisations, isPending: isBulkDeleting } =
    trpc.admin.organisation.bulkDelete.useMutation();

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

  const onPaginationChange = (page: number, perPage: number) => {
    updateSearchParams({
      page,
      perPage,
    });
  };

  const onBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(_(msg`Are you sure you want to delete ${selectedIds.length} organisations?`))) {
      return;
    }

    try {
      const result = await bulkDeleteOrganisations({ ids: selectedIds });
      toast({
        title: _(msg`Organisations deleted`),
        description: _(msg`Successfully deleted ${result.deletedCount} organisations.`),
      });
      setRowSelection({});
      navigate('.', { replace: true });
    } catch (err) {
      toast({
        title: _(msg`Error`),
        description: _(msg`Failed to delete organisations.`),
        variant: 'destructive',
      });
    }
  };

  const columns = useMemo(() => {
    return [
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
        header: t`Organisation`,
        accessorKey: 'name',
        cell: ({ row }) => (
          <Link to={`/admin/organisations/${row.original.id}`}>{row.original.name}</Link>
        ),
      },
      {
        header: t`Created At`,
        accessorKey: 'createdAt',
        cell: ({ row }) => i18n.date(row.original.createdAt),
      },
      {
        header: t`Owner`,
        accessorKey: 'owner',
        cell: ({ row }) => (
          <Link to={`/admin/users/${row.original.owner.id}`}>{row.original.owner.name}</Link>
        ),
      },
      {
        id: 'role',
        header: t`Role`,
        cell: ({ row }) => (
          <Badge variant="neutral">
            {row.original.owner.id === memberUserId ? t`Owner` : t`Member`}
          </Badge>
        ),
      },
      {
        id: 'billingStatus',
        header: t`Status`,
        cell: ({ row }) => {
          const subscription = row.original.subscription;
          const isPaid = subscription && subscription.status === 'ACTIVE';
          return (
            <div
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                isPaid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isPaid ? (
                <Trans context="Subscription status">Paid</Trans>
              ) : (
                <Trans context="Subscription status">Free</Trans>
              )}
            </div>
          );
        },
      },
      {
        header: t`Subscription`,
        cell: ({ row }) =>
          row.original.subscription ? (
            <Link
              to={`https://dashboard.stripe.com/subscriptions/${row.original.subscription.planId}`}
              target="_blank"
              className="flex flex-row items-center gap-2"
            >
              {SUBSCRIPTION_STATUS_MAP[row.original.subscription.status]}
              <ExternalLinkIcon className="h-4 w-4" />
            </Link>
          ) : (
            <Trans>None</Trans>
          ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreHorizontalIcon className="text-muted-foreground h-5 w-5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-52" align="start" forceMount>
              <DropdownMenuLabel>
                <Trans>Actions</Trans>
              </DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link to={`/admin/organisations/${row.original.id}`}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <Trans>Manage</Trans>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to={`/admin/users/${row.original.owner.id}`}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <Trans>View owner</Trans>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem disabled={!row.original.customerId} asChild>
                <Link to={`https://dashboard.stripe.com/customers/${row.original.customerId}`}>
                  <CreditCardIcon className="mr-2 h-4 w-4" />
                  <Trans>Stripe</Trans>
                  {!row.original.customerId && <span>&nbsp;(N/A)</span>}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ] satisfies DataTableColumnDef<(typeof results)['data'][number]>[];
  }, [t, i18n, memberUserId, _]);

  return (
    <div className="relative">
      {selectedIds.length > 0 && (
        <div className="mb-4 flex flex-row items-center gap-2 rounded-md bg-muted px-3 py-2 animate-in fade-in slide-in-from-top-1">
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
      <DataTable
        columns={columns}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={onPaginationChange}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        columnVisibility={{
          owner: showOwnerColumn,
          role: memberUserId !== undefined,
        }}
        error={{
          enable: isLoadingError,
        }}
        skeleton={{
          enable: isLoading,
          rows: 3,
          component: (
            <>
              <TableCell className="py-4 pr-4">
                <Skeleton className="h-4 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="flex flex-row justify-end space-x-2">
                  <Skeleton className="h-2 w-6 rounded" />
                </div>
              </TableCell>
            </>
          ),
        }}
      >
        {(table) =>
          !hidePaginationUntilOverflow || 1 > table.getPageCount() ? (
            <DataTablePagination additionalInformation="VisibleCount" table={table} />
          ) : null
        }
      </DataTable>

      {isBulkDeleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
          <Loader className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};
