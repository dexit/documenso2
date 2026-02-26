import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import { Textarea } from '@documenso/ui/primitives/textarea';
import { useToast } from '@documenso/ui/primitives/use-toast';
import type { TSiteSettingsSupport } from '@documenso/lib/server-only/site-settings/schemas/support';

export type SupportTicketFormProps = {
  organisationId: string;
  orgUrl: string;
  teamId?: string | null;
  supportSettings?: TSiteSettingsSupport | null;
  onSuccess?: () => void;
  onClose?: () => void;
};

export const SupportTicketForm = ({
  organisationId,
  orgUrl,
  teamId,
  supportSettings,
  onSuccess,
  onClose,
}: SupportTicketFormProps) => {
  const { t } = useLingui();
  const { toast } = useToast();

  const { mutateAsync: submitSupportTicket, isPending } =
    trpc.organisation.submitSupportTicket.useMutation();

  const dynamicFields = supportSettings?.data.fields ?? [
    { id: 'subject', label: t`Subject`, type: 'text', required: true },
    { id: 'message', label: t`Message`, type: 'textarea', required: true },
  ];

  const schemaObject: Record<string, any> = {};
  const defaultValues: Record<string, any> = {};

  dynamicFields.forEach((field) => {
    let fieldSchema = z.string();
    if (field.required) {
      fieldSchema = fieldSchema.min(1, t`${field.label} is required`);
    } else {
      fieldSchema = fieldSchema.optional() as any;
    }
    schemaObject[field.id] = fieldSchema;
    defaultValues[field.id] = '';
  });

  const ZDynamicSchema = z.object(schemaObject);

  const form = useForm<any>({
    resolver: zodResolver(ZDynamicSchema),
    defaultValues,
  });

  const isLoading = form.formState.isLoading || isPending;

  const onSubmit = async (values: any) => {
    try {
      await submitSupportTicket({
        orgUrl,
        values,
      });

      toast({
        title: t`Support ticket created`,
        description: t`Your support request has been submitted. We'll get back to you soon!`,
      });

      if (onSuccess) {
        onSuccess();
      }

      form.reset();
    } catch (err) {
      toast({
        title: t`Failed to create support ticket`,
        description: t`An error occurred. Please try again later.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <fieldset disabled={isLoading} className="flex flex-col gap-4">
            {dynamicFields.map((field) => (
              <FormField
                key={field.id}
                control={form.control}
                name={field.id}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel required={field.required}>
                      <Trans>{field.label}</Trans>
                    </FormLabel>
                    <FormControl>
                      {field.type === 'textarea' ? (
                        <Textarea rows={5} {...formField} />
                      ) : field.type === 'select' ? (
                        <select
                          {...formField}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">{t`Select an option`}</option>
                          {field.options?.split(',').map((opt) => (
                            <option key={opt.trim()} value={opt.trim()}>
                              {opt.trim()}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input type={field.type} {...formField} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            <div className="mt-2 flex flex-row gap-2">
              <Button type="submit" size="sm" loading={isLoading}>
                <Trans>Submit</Trans>
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" type="button" onClick={onClose}>
                  <Trans>Close</Trans>
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      </Form>
    </>
  );
};
