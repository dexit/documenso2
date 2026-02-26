import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFieldArray, useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import type { z } from 'zod';

import { getSiteSettings } from '@documenso/lib/server-only/site-settings/get-site-settings';
import { SITE_SETTINGS_404_ID, ZSiteSettings404Schema } from '@documenso/lib/server-only/site-settings/schemas/404';
import { SITE_SETTINGS_ACCESS_CONTROL_ID, ZSiteSettingsAccessControlSchema } from '@documenso/lib/server-only/site-settings/schemas/access-control';
import { SITE_SETTINGS_ANALYTICS_ID, ZSiteSettingsAnalyticsSchema } from '@documenso/lib/server-only/site-settings/schemas/analytics';
import { SITE_SETTINGS_BANNER_ID, ZSiteSettingsBannerSchema } from '@documenso/lib/server-only/site-settings/schemas/banner';
import { SITE_SETTINGS_EMAIL_DESIGN_ID, ZSiteSettingsEmailDesignSchema } from '@documenso/lib/server-only/site-settings/schemas/email-design';
import { SITE_SETTINGS_SUPPORT_ID, ZSiteSettingsSupportSchema } from '@documenso/lib/server-only/site-settings/schemas/support';
import { trpc as trpcReact } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@documenso/ui/primitives/card';
import { ColorPicker } from '@documenso/ui/primitives/color-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import { RichTextEditor } from '@documenso/ui/primitives/rich-text-editor';
import { Switch } from '@documenso/ui/primitives/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { SettingsHeader } from '~/components/general/settings-header';

import type { Route } from './+types/site-settings';

export async function loader() {
  const settings = await getSiteSettings();

  const banner = settings.find((s) => s.id === SITE_SETTINGS_BANNER_ID);
  const error404 = settings.find((s) => s.id === SITE_SETTINGS_404_ID);
  const analytics = settings.find((s) => s.id === SITE_SETTINGS_ANALYTICS_ID);
  const emailDesign = settings.find((s) => s.id === SITE_SETTINGS_EMAIL_DESIGN_ID);
  const accessControl = settings.find((s) => s.id === SITE_SETTINGS_ACCESS_CONTROL_ID);
  const support = settings.find((s) => s.id === SITE_SETTINGS_SUPPORT_ID);

  return { banner, error404, analytics, emailDesign, accessControl, support };
}

export default function AdminSiteSettingsPage({ loaderData }: Route.ComponentProps) {
  const { banner, error404, analytics, emailDesign, accessControl, support } = loaderData;

  const { toast } = useToast();
  const { t } = useLingui();
  const { revalidate } = useRevalidator();

  const { mutateAsync: updateSiteSetting, isPending: isUpdating } =
    trpcReact.admin.updateSiteSetting.useMutation();

  const handleUpdate = async (id: string, enabled: boolean, data: any) => {
    try {
      await updateSiteSetting({ id, enabled, data });
      toast({ title: t`Settings Updated` });
      await revalidate();
    } catch (err) {
      toast({
        title: t`An unknown error occurred`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <SettingsHeader
        title={t`Site Settings`}
        subtitle={t`Manage your site settings here`}
      />

      <div className="mt-8">
        <Tabs defaultValue="banner">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="banner">
              <Trans>Banner</Trans>
            </TabsTrigger>
            <TabsTrigger value="404">
              <Trans>404 Page</Trans>
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Trans>Analytics</Trans>
            </TabsTrigger>
            <TabsTrigger value="email-design">
              <Trans>Email Design</Trans>
            </TabsTrigger>
            <TabsTrigger value="access-control">
              <Trans>Access Control</Trans>
            </TabsTrigger>
            <TabsTrigger value="support">
              <Trans>Support Form</Trans>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banner" className="mt-4">
            <BannerForm initialData={banner} onUpdate={handleUpdate} isUpdating={isUpdating} />
          </TabsContent>

          <TabsContent value="404" className="mt-4">
            <Error404Form error404={error404} onUpdate={handleUpdate} isUpdating={isUpdating} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <AnalyticsForm analytics={analytics} onUpdate={handleUpdate} isUpdating={isUpdating} />
          </TabsContent>

          <TabsContent value="email-design" className="mt-4">
            <EmailDesignForm emailDesign={emailDesign} onUpdate={handleUpdate} isUpdating={isUpdating} />
          </TabsContent>

          <TabsContent value="access-control" className="mt-4">
            <AccessControlForm
              accessControl={accessControl}
              onUpdate={handleUpdate}
              isUpdating={isUpdating}
            />
          </TabsContent>

          <TabsContent value="support" className="mt-4">
            <SupportForm initialData={support} onUpdate={handleUpdate} isUpdating={isUpdating} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

type SiteSettingsFormProps<T> = {
  onUpdate: (id: string, enabled: boolean, data: any) => Promise<void>;
  isUpdating: boolean;
  initialData?: T;
};

function BannerForm({ initialData: banner, onUpdate, isUpdating }: SiteSettingsFormProps<any>) {
  const form = useForm<z.infer<typeof ZSiteSettingsBannerSchema>>({
    resolver: zodResolver(ZSiteSettingsBannerSchema),
    defaultValues: {
      id: SITE_SETTINGS_BANNER_ID,
      enabled: banner?.enabled ?? false,
      data: {
        content: banner?.data?.content ?? '',
        bgColor: banner?.data?.bgColor ?? '#000000',
        textColor: banner?.data?.textColor ?? '#FFFFFF',
      },
    },
  });

  const enabled = form.watch('enabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle><Trans>Site Banner</Trans></CardTitle>
        <CardDescription>
          <Trans>Shown at the top of the site for all users.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onUpdate(v.id, v.enabled, v.data))} className="space-y-4">
            <fieldset disabled={isUpdating} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel><Trans>Enabled</Trans></FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data.bgColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><Trans>Background Color</Trans></FormLabel>
                      <FormControl><ColorPicker {...field} disabled={!enabled} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data.textColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><Trans>Text Color</Trans></FormLabel>
                      <FormControl><ColorPicker {...field} disabled={!enabled} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="data.content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Content</Trans></FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!enabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" loading={isUpdating} disabled={!form.formState.isDirty}>
                <Trans>Save Changes</Trans>
              </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function Error404Form({ error404, onUpdate, isUpdating }: SiteSettingsFormProps<any> & { error404: any }) {
  const form = useForm<z.infer<typeof ZSiteSettings404Schema>>({
    resolver: zodResolver(ZSiteSettings404Schema),
    defaultValues: {
      id: SITE_SETTINGS_404_ID,
      enabled: error404?.enabled ?? false,
      data: {
        title: error404?.data?.title ?? '404 - Page Not Found',
        content: error404?.data?.content ?? '',
      },
    },
  });

  const enabled = form.watch('enabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle><Trans>404 Page</Trans></CardTitle>
        <CardDescription>
          <Trans>Custom content for your 404 error page.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onUpdate(v.id, v.enabled, v.data))} className="space-y-4">
            <fieldset disabled={isUpdating} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel><Trans>Use Custom 404 Content</Trans></FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Page Title</Trans></FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!enabled} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Content (WYSIWYG)</Trans></FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!enabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" loading={isUpdating} disabled={!form.formState.isDirty}>
                <Trans>Save Changes</Trans>
              </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AnalyticsForm({ analytics, onUpdate, isUpdating }: SiteSettingsFormProps<any> & { analytics: any }) {
  const form = useForm<z.infer<typeof ZSiteSettingsAnalyticsSchema>>({
    resolver: zodResolver(ZSiteSettingsAnalyticsSchema),
    defaultValues: {
      id: SITE_SETTINGS_ANALYTICS_ID,
      enabled: analytics?.enabled ?? false,
      data: {
        googleAnalyticsId: analytics?.data?.googleAnalyticsId ?? '',
        googleTagManagerId: analytics?.data?.googleTagManagerId ?? '',
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle><Trans>Analytics</Trans></CardTitle>
        <CardDescription>
          <Trans>Configure external analytics and tracking.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onUpdate(v.id, v.enabled, v.data))} className="space-y-4">
            <fieldset disabled={isUpdating} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel><Trans>Enabled</Trans></FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.googleAnalyticsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Google Analytics ID (G-XXXXXXXXXX)</Trans></FormLabel>
                    <FormControl><Input {...field} placeholder="G-XXXXXXXXXX" /></FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.googleTagManagerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Google Tag Manager ID (GTM-XXXXXXX)</Trans></FormLabel>
                    <FormControl><Input {...field} placeholder="GTM-XXXXXXX" /></FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" loading={isUpdating} disabled={!form.formState.isDirty}>
                <Trans>Save Changes</Trans>
              </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function EmailDesignForm({ emailDesign, onUpdate, isUpdating }: SiteSettingsFormProps<any> & { emailDesign: any }) {
  const form = useForm<z.infer<typeof ZSiteSettingsEmailDesignSchema>>({
    resolver: zodResolver(ZSiteSettingsEmailDesignSchema),
    defaultValues: {
      id: SITE_SETTINGS_EMAIL_DESIGN_ID,
      enabled: emailDesign?.enabled ?? false,
      data: {
        headerHtml: emailDesign?.data?.headerHtml ?? '',
        footerHtml: emailDesign?.data?.footerHtml ?? '',
        accentColor: emailDesign?.data?.accentColor ?? '#A2E771',
      },
    },
  });

  const enabled = form.watch('enabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle><Trans>Email Global Design</Trans></CardTitle>
        <CardDescription>
          <Trans>Configure global header and footer for all emails.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => onUpdate(v.id, v.enabled, v.data))} className="space-y-4">
            <fieldset disabled={isUpdating} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel><Trans>Enabled</Trans></FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.accentColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Global Email Accent Color</Trans></FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={!enabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.headerHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Global Header (WYSIWYG)</Trans></FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={!enabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.footerHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><Trans>Global Footer (WYSIWYG)</Trans></FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        disabled={!enabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" loading={isUpdating} disabled={!form.formState.isDirty}>
                <Trans>Save Changes</Trans>
              </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AccessControlForm({
  accessControl,
  onUpdate,
  isUpdating,
}: SiteSettingsFormProps<any> & { accessControl: any }) {
  const form = useForm<z.infer<typeof ZSiteSettingsAccessControlSchema>>({
    resolver: zodResolver(ZSiteSettingsAccessControlSchema),
    defaultValues: {
      id: SITE_SETTINGS_ACCESS_CONTROL_ID,
      enabled: accessControl?.enabled ?? false,
      data: {
        disablePersonalOrganisations: accessControl?.data?.disablePersonalOrganisations ?? false,
        defaultOrganisationId: accessControl?.data?.defaultOrganisationId ?? '',
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Access Control</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Manage user access and organization settings.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => onUpdate(v.id, v.enabled, v.data))}
            className="space-y-4"
          >
            <fieldset disabled={isUpdating} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>
                        <Trans>Enabled</Trans>
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.disablePersonalOrganisations"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>
                        <Trans>Disable Personal Organisations for new customers</Trans>
                      </FormLabel>
                      <CardDescription>
                        <Trans>
                          If enabled, new users will not have personal organisations created.
                        </Trans>
                      </CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data.defaultOrganisationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Default Organisation ID</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Org ID" />
                    </FormControl>
                    <CardDescription>
                      <Trans>
                        The organisation users will be automatically assigned to if personal
                        organisations are disabled.
                      </Trans>
                    </CardDescription>
                  </FormItem>
                )}
              />

              <Button type="submit" loading={isUpdating} disabled={!form.formState.isDirty}>
                <Trans>Save Changes</Trans>
              </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SupportForm({
  initialData: support,
  onUpdate,
  isUpdating,
}: SiteSettingsFormProps<any>) {
  const { t } = useLingui();

  const form = useForm<z.infer<typeof ZSiteSettingsSupportSchema>>({
    resolver: zodResolver(ZSiteSettingsSupportSchema),
    defaultValues: {
      id: SITE_SETTINGS_SUPPORT_ID,
      enabled: support?.enabled ?? false,
      data: {
        title: support?.data?.title ?? 'Contact Support',
        description: support?.data?.description ?? 'How can we help you?',
        fields: support?.data?.fields ?? [],
        target: support?.data?.target ?? 'email',
        targetValue: support?.data?.targetValue ?? '',
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'data.fields',
  });

  const enabled = form.watch('enabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Support Form Builder</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Configure the support form shown to users in their organisation.</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => onUpdate(v.id, v.enabled, v.data))}
            className="space-y-6"
          >
            <fieldset disabled={isUpdating} className="space-y-6">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>
                        <Trans>Enable Support Page</Trans>
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Form Title</Trans>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!enabled} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Form Description</Trans>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!enabled} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    <Trans>Form Fields</Trans>
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!enabled}
                    onClick={() =>
                      append({
                        id: Math.random().toString(36).substr(2, 9),
                        label: t`New Field`,
                        type: 'text',
                        required: false,
                      })
                    }
                  >
                    <Trans>Add Field</Trans>
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end border p-4 rounded-md bg-muted/30">
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`data.fields.${index}.label`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel><Trans>Label</Trans></FormLabel>
                                <FormControl><Input {...field} disabled={!enabled} /></FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`data.fields.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel><Trans>Type</Trans></FormLabel>
                                <FormControl>
                                  <select
                                    {...field}
                                    disabled={!enabled}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <option value="text">Text</option>
                                    <option value="textarea">Textarea</option>
                                    <option value="email">Email</option>
                                    <option value="select">Select</option>
                                  </select>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name={`data.fields.${index}.required`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!enabled} />
                              </FormControl>
                              <FormLabel><Trans>Required</Trans></FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={!enabled}
                        onClick={() => remove(index)}
                      >
                        <Trans>Remove</Trans>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data.target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Submission Target</Trans>
                      </FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={!enabled}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="email">Email</option>
                          <option value="webhook">Webhook</option>
                          <option value="hubspot">HubSpot</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data.targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Target Value (Email/URL)</Trans>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. support@example.com or https://webhook.site/xxx" disabled={!enabled} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" loading={isUpdating} disabled={!form.formState.isDirty}>
                <Trans>Save Changes</Trans>
              </Button>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
