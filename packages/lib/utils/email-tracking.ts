import { createHmac } from 'crypto';

import { NEXT_PUBLIC_WEBAPP_URL } from '../constants/app';
import { DOCUMENSO_ENCRYPTION_KEY } from '../constants/crypto';

const TRACKING_KEY = DOCUMENSO_ENCRYPTION_KEY ?? 'documenso-email-tracking-fallback-key';

export type EmailTrackingPayload = {
  envelopeId: string;
  recipientId: number;
  emailType: string;
};

/**
 * Generates a URL-safe signed token that encodes email tracking metadata.
 */
export const generateEmailTrackingToken = (data: EmailTrackingPayload): string => {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = createHmac('sha256', TRACKING_KEY).update(payload).digest('base64url').slice(0, 20);
  return `${payload}.${sig}`;
};

/**
 * Verifies and decodes an email tracking token. Returns null if invalid.
 */
export const verifyEmailTrackingToken = (token: string): EmailTrackingPayload | null => {
  try {
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payload = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);

    const expectedSig = createHmac('sha256', TRACKING_KEY)
      .update(payload)
      .digest('base64url')
      .slice(0, 20);

    if (sig !== expectedSig) return null;

    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as EmailTrackingPayload;
  } catch {
    return null;
  }
};

/**
 * Returns the full URL for the 1×1 tracking pixel for a given email.
 */
export const generateEmailTrackingPixelUrl = (data: EmailTrackingPayload): string => {
  const token = generateEmailTrackingToken(data);
  return `${NEXT_PUBLIC_WEBAPP_URL()}/api/email-track/open?t=${token}`;
};

/**
 * Injects a hidden 1×1 tracking pixel into an HTML email body.
 */
export const injectEmailTrackingPixel = (html: string, pixelUrl: string): string => {
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none!important;visibility:hidden!important;opacity:0!important;height:0!important;width:0!important;border:0!important;position:absolute!important;overflow:hidden!important" />`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixelHtml}</body>`);
  }

  return html + pixelHtml;
};
