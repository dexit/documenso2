import { useMemo, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { ZUrlSearchParamsSchema } from '@documenso/lib/types/search-params';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { useToast } from '@documenso/ui/primitives/use-toast';
import { Plus, Edit2, Trash } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ZReplacementFormSchema = z.object({
  id: z.string().optional(),
  original: z.string().min(1, 'Required'),
  replacement: z.string(),
});

export default function AdminTranslatorPage() {
  const { t } = useLingui();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const parsedSearchParams = ZUrlSearchParamsSchema.parse(Object.fromEntries(searchParams ?? []));

  const { data, isLoading, refetch } = trpc.admin.stringReplacement.find.useQuery({
    page: parsedSearchParams.page,
    perPage: parsedSearchParams.perPage,
  });

  const { mutate: upsertReplacement, isPending: isSaving } =
    trpc.admin.stringReplacement.upsert.useMutation({
      onSuccess: () => {
        toast({ title: t`Replacement saved.` });
        setIsDialogOpen(false);
        setEditingId(null);
        void refetch();
      },
      onError: () => {
        toast({ title: t`Failed to save replacement`, variant: 'destructive' });
      },
    });

  const { mutate: deleteReplacement } =
    trpc.admin.stringReplacement.delete.useMutation({
      onSuccess: () => {
        toast({ title: t`Replacement deleted.` });
        void refetch();
      },
    });

  const form = useForm<z.infer<typeof ZReplacementFormSchema>>({
    resolver: zodResolver(ZReplacementFormSchema),
    defaultValues: {
      original: '',
      replacement: '',
    },
  });

  const onEdit = (replacement: any) => {
    setEditingId(replacement.id);
    form.reset({
      id: replacement.id,
      original: replacement.original,
      replacement: replacement.replacement,
    });
    setIsDialogOpen(true);
  };

  const columns = useMemo(
    () => [
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
        cell: ({ row }: any) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        cell: ({ row }: any) => (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => {
                if (confirm(t`Are you sure?`)) {
                  deleteReplacement({ id: row.original.id });
                }
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t],
  );

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold"><Trans>String Replacements</Trans></h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              form.reset({ original: '', replacement: '' });
            }}>
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
                <FormField
                  control={form.control}
                  name="original"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><Trans>Original Text</Trans></FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. Documenso" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="replacement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><Trans>Replacement Text</Trans></FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. MyBrand" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" loading={isSaving}>
                  <Trans>Save</Trans>
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        <Trans>Use this to override any text in the application globally. This is applied to all translations.</Trans>
      </p>

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
