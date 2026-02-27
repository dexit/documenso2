import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import type { z } from 'zod';

import { getSiteSettings } from '@documenso/lib/server-only/site-settings/get-site-settings';
import { SITE_SETTINGS_404_ID, ZSiteSettings404Schema } from '@documenso/lib/server-only/site-settings/schemas/404';
import { SITE_SETTINGS_ANALYTICS_ID, ZSiteSettingsAnalyticsSchema } from '@documenso/lib/server-only/site-settings/schemas/analytics';
import { SITE_SETTINGS_BANNER_ID, ZSiteSettingsBannerSchema } from '@documenso/lib/server-only/site-settings/schemas/banner';
import { SITE_SETTINGS_EMAIL_DESIGN_ID, ZSiteSettingsEmailDesignSchema } from '@documenso/lib/server-only/site-settings/schemas/email-design';
import { trpc as trpcReact } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@documenso/ui/primitives/card';
import { ColorPicker } from '@documenso/ui/primitives/color-picker';
import {
  Form,
  FormControl,
  FormDescription,
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

  return { banner, error404, analytics, emailDesign };
}

export default function AdminSiteSettingsPage({ loaderData }: Route.ComponentProps) {
  const { banner, error404, analytics, emailDesign } = loaderData;

  const { toast } = useToast();
  const { _ } = useLingui();
  const { revalidate } = useRevalidator();

  const { mutateAsync: updateSiteSetting, isPending: isUpdating } =
    trpcReact.admin.updateSiteSetting.useMutation();

  const handleUpdate = async (id: any, enabled: boolean, data: any) => {
    try {
      await updateSiteSetting({ id, enabled, data } as any);
      toast({ title: _(msg`Settings Updated`) });
      await revalidate();
    } catch (err) {
      toast({
        title: _(msg`An unknown error occurred`),
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <SettingsHeader
        title={_(msg`Site Settings`)}
        subtitle={_(msg`Manage your site settings here`)}
      />

      <div className="mt-8">
        <Tabs defaultValue="banner">
          <TabsList className="grid w-full grid-cols-4">
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
          </TabsList>

          <TabsContent value="banner" className="mt-4">
            <BannerForm banner={banner} onUpdate={handleUpdate} isUpdating={isUpdating} />
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
        </Tabs>
      </div>
    </div>
  );
}

function BannerForm({ banner, onUpdate, isUpdating }: any) {
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function Error404Form({ error404, onUpdate, isUpdating }: any) {
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AnalyticsForm({ analytics, onUpdate, isUpdating }: any) {
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function EmailDesignForm({ emailDesign, onUpdate, isUpdating }: any) {
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
