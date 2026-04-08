import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import { extractRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import { verifyEmailTrackingToken } from '@documenso/lib/utils/email-tracking';
import { prisma } from '@documenso/prisma';

// Minimal 1×1 transparent GIF (35 bytes)
const TRACKING_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

const PIXEL_RESPONSE_HEADERS = {
  'Content-Type': 'image/gif',
  'Content-Length': String(TRACKING_PIXEL_GIF.byteLength),
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
  Expires: '0',
} as const;

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');

  // Always return the pixel — tracking is best-effort
  const pixelResponse = new Response(TRACKING_PIXEL_GIF, {
    headers: PIXEL_RESPONSE_HEADERS,
  });

  if (!token) return pixelResponse;

  const payload = verifyEmailTrackingToken(token);
  if (!payload) return pixelResponse;

  // Log the open event asynchronously so the pixel is returned immediately
  void (async () => {
    try {
      const { envelopeId, recipientId, emailType } = payload;

      const recipient = await prisma.recipient.findFirst({
        where: { id: recipientId, envelopeId },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!recipient) return;

      const meta = extractRequestMetadata(request);

      await prisma.documentAuditLog.create({
        data: {
          type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED,
          envelopeId,
          email: recipient.email,
          name: recipient.name,
          ipAddress: meta.ipAddress ?? null,
          userAgent: meta.userAgent ?? null,
          data: {
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            recipientId: recipient.id,
            recipientRole: recipient.role,
            emailType,
            isPixelTracked: true,
          },
        },
      });
    } catch {
      // Silently ignore — never let tracking errors surface to recipients
    }
  })();

  return pixelResponse;
}
