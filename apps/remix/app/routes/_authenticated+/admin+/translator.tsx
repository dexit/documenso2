import { useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Edit2, Loader, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc, type RouterOutputs } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import type { RowSelectionState } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import { useToast } from '@documenso/ui/primitives/use-toast';

const ZReplacementFormSchema = z.object({
  id: z.string().optional(),
  original: z.string().min(1, 'Required'),
  replacement: z.string(),
});

type ReplacementRow = RouterOutputs['admin']['stringReplacement']['find']['data'][number];

export default function AdminTranslatorPage() {
  const { t, i18n, _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, refetch } = trpc.admin.stringReplacement.find.useQuery({
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
  });

  const { mutate: upsertReplacement, isPending: isSaving } =
    trpc.admin.stringReplacement.upsert.useMutation({
      onSuccess: () => {
        toast({
          title: t`Replacement saved. Refresh may be needed for all changes to take effect.`,
        });
        setIsDialogOpen(false);
        setEditingId(null);
        void refetch();
      },
      onError: () => {
        toast({ title: t`Failed to save replacement`, variant: 'destructive' });
      },
    });

  const { mutateAsync: bulkDeleteReplacements, isPending: isBulkDeleting } =
    trpc.admin.stringReplacement.bulkDelete.useMutation();

  const form = useForm<z.infer<typeof ZReplacementFormSchema>>({
    resolver: zodResolver(ZReplacementFormSchema),
    defaultValues: {
      original: '',
      replacement: '',
    },
  });

  const onEdit = (replacement: ReplacementRow) => {
    setEditingId(replacement.id);
    form.reset({
      id: replacement.id,
      original: replacement.original,
      replacement: replacement.replacement,
    });
    setIsDialogOpen(true);
  };

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

    if (!confirm(_(msg`Are you sure you want to delete ${selectedIds.length} replacements?`))) {
      return;
    }

    try {
      const result = await bulkDeleteReplacements({ ids: selectedIds });
      toast({
        title: _(msg`Replacements deleted`),
        description: _(msg`Successfully deleted ${result.deletedCount} replacements.`),
      });
      setRowSelection({});
      navigate('.', { replace: true });
    } catch (err) {
      toast({
        title: _(msg`Error`),
        description: _(msg`Failed to delete replacements.`),
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
        header: t`Original Text`,
        accessorKey: 'original',
      },
      {
        header: t`Replacement`,
        accessorKey: 'replacement',
      },
      {
        header: t`Created At`,
        accessorKey: 'createdAt',
        cell: ({ row }: { row: { original: ReplacementRow } }) => i18n.date(row.original.createdAt),
      },
      {
        id: 'actions',
        cell: ({ row }: { row: { original: ReplacementRow } }) => (
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
            <Edit2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.locale, onEdit, _],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          <Trans>String Replacements</Trans>
        </h2>
        <div className="flex flex-row items-center gap-2">
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  form.reset({ original: '', replacement: '' });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <Trans>Add Replacement</Trans>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? t`Edit Replacement` : t`Add Replacement`}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => upsertReplacement(v))} className="space-y-4">
                  <fieldset disabled={isSaving} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="original"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>Original Text</Trans>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Documenso" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="replacement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Trans>Replacement Text</Trans>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. MyBrand" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" loading={isSaving}>
                      <Trans>Save</Trans>
                    </Button>
                  </fieldset>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        <Trans>
          Use this to override any text in the application globally. This is applied to all
          translations.
        </Trans>
      </p>

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
