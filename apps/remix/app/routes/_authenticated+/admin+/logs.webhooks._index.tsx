import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { WebhookIcon } from 'lucide-react';

import { AdminWebhookLogsTable } from '~/components/tables/admin-webhook-logs-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Webhook Logs`);
}

export default function AdminWebhookLogsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <WebhookIcon className="h-8 w-8 text-muted-foreground" />
        <div>
          <h2 className="text-4xl font-semibold">
            <Trans>Webhook Logs</Trans>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans>
              All webhook delivery attempts across all teams. Filter by status and inspect full
              request and response payloads.
            </Trans>
          </p>
        </div>
      </div>

      <AdminWebhookLogsTable />
    </div>
  );
}
