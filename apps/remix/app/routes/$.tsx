import { data } from 'react-router';

import { logHttpRequest } from '@documenso/lib/server-only/http-monitor/store';

import type { Route } from './+types/$';

/**
 * Catch-all route for unmatched paths.
 * Logs 404 hits to the in-memory HTTP monitor store for admin inspection.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  logHttpRequest({
    method: request.method,
    path: url.pathname + (url.search ? url.search : ''),
    ip,
    userAgent: request.headers.get('user-agent') ?? '',
    referer: request.headers.get('referer') ?? null,
    statusCode: 404,
  });

  throw data(null, { status: 404 });
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
    </div>
  );
}
