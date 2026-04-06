import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { KeyIcon } from 'lucide-react';

import { AdminApiTokensTable } from '~/components/tables/admin-api-tokens-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`API Tokens`);
}

export default function AdminApiTokensPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <KeyIcon className="h-8 w-8 text-muted-foreground" />
        <div>
          <h2 className="text-4xl font-semibold">
            <Trans>API Tokens</Trans>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans>
              All API tokens across all teams. Review expiry status and ownership.
            </Trans>
          </p>
        </div>
      </div>

      <AdminApiTokensTable />
    </div>
  );
}
