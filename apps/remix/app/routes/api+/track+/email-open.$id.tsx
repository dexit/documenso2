import type { LoaderFunctionArgs } from 'react-router';
import { prisma } from '@documenso/prisma';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params.id;

  if (id) {
    const userAgent = request.headers.get('user-agent');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    try {
      await prisma.emailInteraction.create({
        data: {
          emailId: id,
          type: 'OPEN',
          userAgent,
          ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
        },
      });

      await prisma.email.update({
        where: { id },
        data: { openedAt: new Date() },
      });
    } catch (error) {
      console.error('Failed to track email open', error);
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
