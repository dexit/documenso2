import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  KeyIcon,
  MailIcon,
  MailOpenIcon,
  UsersIcon,
  WebhookIcon,
  XCircleIcon,
} from 'lucide-react';
import { useSearchParams } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { trpc } from '@documenso/trpc/react';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';

import { AdminActivityLogsTable } from '~/components/tables/admin-activity-logs-table';
import { AdminApiTokensTable } from '~/components/tables/admin-api-tokens-table';
import { AdminEmailsTable } from '~/components/tables/admin-emails-table';
import { AdminRecipientStatsTable } from '~/components/tables/admin-recipient-stats-table';
import { AdminWebhookLogsTable } from '~/components/tables/admin-webhook-logs-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Activity Logs`);
}

type StatCardProps = {
  icon: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  colorClass?: string;
};

function StatCard({ icon, label, value, sub, colorClass = 'bg-blue-100 dark:bg-blue-900/30' }: StatCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <div className={`rounded-full p-2 ${colorClass}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-none">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function StatsRow() {
  const { data, isLoading } = trpc.admin.document.getStats.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { emails, signRequests, activities } = data;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        icon={<MailIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
        label={<Trans>Emails Sent</Trans>}
        value={emails.sent.total.toLocaleString()}
        sub={<Trans>+{emails.sent.today} today</Trans>}
        colorClass="bg-blue-100 dark:bg-blue-900/30"
      />
      <StatCard
        icon={<MailOpenIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
        label={<Trans>Emails Opened</Trans>}
        value={emails.opened.total.toLocaleString()}
        sub={<Trans>{emails.openRate}% open rate</Trans>}
        colorClass="bg-cyan-100 dark:bg-cyan-900/30"
      />
      <StatCard
        icon={<FileTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        label={<Trans>Sign Requests</Trans>}
        value={signRequests.total.toLocaleString()}
        sub={<Trans>{signRequests.pending} pending</Trans>}
        colorClass="bg-purple-100 dark:bg-purple-900/30"
      />
      <StatCard
        icon={<CheckCircle2Icon className="h-5 w-5 text-green-600 dark:text-green-400" />}
        label={<Trans>Completed</Trans>}
        value={signRequests.completed.toLocaleString()}
        colorClass="bg-green-100 dark:bg-green-900/30"
      />
      <StatCard
        icon={<XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
        label={<Trans>Rejected</Trans>}
        value={signRequests.rejected.toLocaleString()}
        colorClass="bg-red-100 dark:bg-red-900/30"
      />
      <StatCard
        icon={<ClockIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
        label={<Trans>Events Today</Trans>}
        value={activities.today.toLocaleString()}
        sub={<Trans>{activities.thisWeek} this week</Trans>}
        colorClass="bg-orange-100 dark:bg-orange-900/30"
      />
    </div>
  );
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
            Monitor all document, email, and signing activity across all teams and recipients.
          </Trans>
        </p>
      </div>

      {/* Live stats — all teams */}
      <StatsRow />

      <Tabs value={activeTab} onValueChange={(tab) => updateSearchParams({ tab, page: 1 })}>
        <TabsList className="mb-6">
          <TabsTrigger value="activity">
            <ActivityIcon className="mr-2 h-4 w-4" />
            <Trans>All Activity</Trans>
          </TabsTrigger>
          <TabsTrigger value="emails">
            <MailIcon className="mr-2 h-4 w-4" />
            <Trans>Emails</Trans>
          </TabsTrigger>
          <TabsTrigger value="recipients">
            <UsersIcon className="mr-2 h-4 w-4" />
            <Trans>Recipients</Trans>
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <WebhookIcon className="mr-2 h-4 w-4" />
            <Trans>Webhooks</Trans>
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <KeyIcon className="mr-2 h-4 w-4" />
            <Trans>API Tokens</Trans>
          </TabsTrigger>
        </TabsList>

        {/* All Activity Tab */}
        <TabsContent value="activity">
          <AdminActivityLogsTable />
        </TabsContent>

        {/* Emails Tab — dedicated email tracking view */}
        <TabsContent value="emails">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              <Trans>
                All outbound emails with open-tracking status. A tracking pixel is embedded in
                signing and reminder emails — open events appear automatically when recipients load
                images.
              </Trans>
            </p>
          </div>
          <AdminEmailsTable />
        </TabsContent>

        {/* Recipients Tab */}
        <TabsContent value="recipients">
          <AdminRecipientStatsTable />
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              <Trans>
                All webhook delivery attempts across all teams. View request/response payloads and filter by success or failure.
              </Trans>
            </p>
          </div>
          <AdminWebhookLogsTable />
        </TabsContent>

        {/* API Tokens Tab */}
        <TabsContent value="tokens">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              <Trans>
                All API tokens across all teams. Manage and audit API access across your instance.
              </Trans>
            </p>
          </div>
          <AdminApiTokensTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
