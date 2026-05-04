import type { LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '@documenso/prisma';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { id } = params;

  if (id) {
    try {
      await prisma.emailInteraction.create({
        data: {
          emailLogId: id,
          type: 'OPEN',
          metadata: {
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          },
        },
      });
    } catch (e) {
      console.error('Failed to track email open:', e);
    }
  }

  // Return a 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64',
  );

  return new Response(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
};
