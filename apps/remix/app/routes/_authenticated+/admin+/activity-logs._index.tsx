import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ActivityIcon, MailIcon, UsersIcon } from 'lucide-react';
import { useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';

import { AdminActivityLogsTable } from '~/components/tables/admin-activity-logs-table';
import { AdminRecipientStatsTable } from '~/components/tables/admin-recipient-stats-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Activity Logs`);
}

export default function AdminActivityLogsPage() {
  const [searchParams] = useSearchParams();
  const updateSearchParams = useUpdateSearchParams();

  const activeTab = searchParams.get('tab') ?? 'activity';

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-4xl font-semibold">
          <Trans>Activity Logs</Trans>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans>
            Monitor all document, email, and signing activity across the platform.
          </Trans>
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
            <MailIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              <Trans>Emails Sent</Trans>
            </p>
            <p className="text-lg font-semibold">
              <Trans>All time</Trans>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <ActivityIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              <Trans>Sign Requests</Trans>
            </p>
            <p className="text-lg font-semibold">
              <Trans>Track & manage</Trans>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
            <UsersIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              <Trans>Recipients</Trans>
            </p>
            <p className="text-lg font-semibold">
              <Trans>Stats & history</Trans>
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(tab) => updateSearchParams({ tab, page: 1 })}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="activity">
            <ActivityIcon className="mr-2 h-4 w-4" />
            <Trans>Activity Log</Trans>
          </TabsTrigger>
          <TabsTrigger value="recipients">
            <UsersIcon className="mr-2 h-4 w-4" />
            <Trans>Recipients</Trans>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <AdminActivityLogsTable />
        </TabsContent>

        <TabsContent value="recipients">
          <AdminRecipientStatsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
