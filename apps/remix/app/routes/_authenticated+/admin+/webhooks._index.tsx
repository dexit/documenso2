import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Link } from 'react-router';

import { Button } from '@documenso/ui/primitives/button';

import { AdminWebhooksTable } from '~/components/tables/admin-webhooks-table';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Webhooks`);
}

export default function AdminWebhooksPage() {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-semibold">
            <Trans>Webhooks</Trans>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <Trans>
              All webhook endpoints configured across every team. View delivery history and filter by
              status.
            </Trans>
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/logs/webhooks">
            <Trans>Delivery logs</Trans>
          </Link>
        </Button>
      </div>

      <AdminWebhooksTable />
    </div>
  );
}
