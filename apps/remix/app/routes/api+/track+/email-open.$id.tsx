import type { LoaderFunctionArgs } from 'react-router';
import { prisma } from '@documenso/prisma';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;

  if (id) {
    const userAgent = request.headers.get('user-agent');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    try {
      // Pixel firing proves delivery: if this HTTP request reaches our server,
      // the email was necessarily delivered and rendered by the recipient's client.
      // This is the standard pixel-based delivery confirmation approach used by
      // Mailchimp, HubSpot, etc. Caveats inherent to all pixel tracking:
      //   - Image-blocking clients (Outlook corporate, some Gmail configs) won't fire
      //   - Apple Mail Privacy Protection pre-fetches via Apple proxy (inflates opens)
      await Promise.all([
        // Log each open interaction separately (multiple opens are normal).
        prisma.emailInteraction.create({
          data: {
            emailId: id,
            type: 'OPEN',
            userAgent,
            ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
          },
        }),

        // Always update openedAt (latest open time).
        prisma.email.update({
          where: { id },
          data: { openedAt: new Date() },
        }),

        // Mark as DELIVERED only on the first pixel load (deliveredAt not yet set).
        // Subsequent opens keep DELIVERED status but don't re-set deliveredAt.
        prisma.email.updateMany({
          where: { id, deliveredAt: null },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        }),
      ]);
    } catch (error) {
      console.error('Failed to track email open/delivery', error);
    }
  }

  // Return a 1x1 transparent GIF
  const buffer = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64',
  );

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
