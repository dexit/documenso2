import { useEffect, useMemo, useState, useTransition } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type { Role, Subscription } from '@prisma/client';
import { Edit, Loader, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import type { DataTableColumnDef, RowSelectionState } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { Input } from '@documenso/ui/primitives/input';
import { useToast } from '@documenso/ui/primitives/use-toast';

type UserData = {
  id: number;
  name: string | null;
  email: string;
  roles: Role[];
  subscriptions?: SubscriptionLite[] | null;
  documentCount: number;
};

type SubscriptionLite = Pick<
  Subscription,
  'id' | 'status' | 'planId' | 'priceId' | 'createdAt' | 'periodEnd'
>;

type AdminDashboardUsersTableProps = {
  users: UserData[];
  totalPages: number;
  perPage: number;
  page: number;
};

export const AdminDashboardUsersTable = ({
  users,
  totalPages,
  perPage,
  page,
}: AdminDashboardUsersTableProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isPending, startTransition] = useTransition();
  const updateSearchParams = useUpdateSearchParams();
  const [searchString, setSearchString] = useState('');
  const debouncedSearchString = useDebouncedValue(searchString, 1000);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { mutateAsync: bulkDeleteUsers, isPending: isBulkDeleting } =
    trpc.admin.user.bulkDelete.useMutation();

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => users[Number(key)]?.id)
      .filter((id): id is number => id !== undefined);
  }, [rowSelection, users]);

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
        header: _(msg`ID`),
        accessorKey: 'id',
        cell: ({ row }) => <div>{row.original.id}</div>,
      },
      {
        header: _(msg`Name`),
        accessorKey: 'name',
        cell: ({ row }) => <div>{row.original.name}</div>,
      },
      {
        header: _(msg`Email`),
        accessorKey: 'email',
        cell: ({ row }) => <div>{row.original.email}</div>,
      },
      {
        header: _(msg`Roles`),
        accessorKey: 'roles',
        cell: ({ row }) => row.original.roles.join(', '),
      },
      {
        header: _(msg`Documents`),
        accessorKey: 'documentCount',
      },
      {
        header: '',
        accessorKey: 'edit',
        cell: ({ row }) => {
          return (
            <Button className="w-24" asChild>
              <Link to={`/admin/users/${row.original.id}`}>
                <Edit className="-ml-1 mr-2 h-4 w-4" />
                <Trans>Edit</Trans>
              </Link>
            </Button>
          );
        },
      },
    ] satisfies DataTableColumnDef<(typeof users)[number]>[];
  }, [_]);

  useEffect(() => {
    startTransition(() => {
      updateSearchParams({
        search: debouncedSearchString,
        page: 1,
        perPage,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchString]);

  const onPaginationChange = (page: number, perPage: number) => {
    startTransition(() => {
      updateSearchParams({
        page,
        perPage,
      });
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  };

  const onBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(_(msg`Are you sure you want to delete ${selectedIds.length} users?`))) {
      return;
    }

    try {
      const result = await bulkDeleteUsers({ ids: selectedIds });
      toast({
        title: _(msg`Users deleted`),
        description: _(msg`Successfully deleted ${result.deletedCount} users.`),
      });
      setRowSelection({});
      navigate('.', { replace: true });
    } catch (err) {
      toast({
        title: _(msg`Error`),
        description: _(msg`Failed to delete users.`),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative">
      <div className="my-6 flex flex-row items-center gap-4">
        <Input
          className="flex-1"
          type="text"
          placeholder={_(msg`Search by name or email`)}
          value={searchString}
          onChange={handleChange}
        />
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
      <DataTable
        columns={columns}
        data={users}
        perPage={perPage}
        currentPage={page}
        totalPages={totalPages}
        onPaginationChange={onPaginationChange}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      >
        {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
      </DataTable>

      {(isPending || isBulkDeleting) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
          <Loader className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};
