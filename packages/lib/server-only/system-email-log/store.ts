import { prisma } from '@documenso/prisma';

export type SystemEmailType =
  | 'signup_confirmation'
  | 'password_reset'
  | 'password_changed'
  | 'other';

export type LogSystemEmailOptions = {
  type: SystemEmailType;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  userId?: number | null;
  metadata?: Record<string, unknown>;
};

/**
 * Persist a system (non-document) email to the database.
 * Fire-and-forget — errors are swallowed so they never break the calling flow.
 */
export function logSystemEmail(options: LogSystemEmailOptions): void {
  const { type, recipientEmail, recipientName, subject, userId, metadata } = options;

  prisma.systemEmailLog
    .create({
      data: {
        type,
        recipientEmail,
        recipientName: recipientName ?? null,
        subject,
        userId: userId ?? null,
        metadata: metadata ?? {},
      },
    })
    .catch((err) => {
      console.error('[SystemEmailLog] Failed to persist email log:', err);
    });
}

export type { LogSystemEmailOptions as SystemEmailEntry };
