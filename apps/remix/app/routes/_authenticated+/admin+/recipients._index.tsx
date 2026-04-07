import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { AdminRecipientStatsTable } from '~/components/tables/admin-recipient-stats-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Recipients`);
}

export default function AdminRecipientsPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-4xl font-semibold">
          <Trans>Recipients</Trans>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans>
            All recipients across every document — with signing status, completion rates, and
            activity history.
          </Trans>
        </p>
      </div>

      <AdminRecipientStatsTable />
    </div>
  );
}
