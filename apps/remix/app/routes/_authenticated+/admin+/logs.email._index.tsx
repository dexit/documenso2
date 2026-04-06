import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { MailIcon } from 'lucide-react';

import { AdminEmailsTable } from '~/components/tables/admin-emails-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Email Logs`);
}

export default function AdminEmailLogsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <MailIcon className="h-8 w-8 text-muted-foreground" />
        <div>
          <h2 className="text-4xl font-semibold">
            <Trans>Email Logs</Trans>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans>
              All outbound emails with open-tracking. Resend any email from the actions column.
            </Trans>
          </p>
        </div>
      </div>

      <AdminEmailsTable />
    </div>
  );
}
