import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { sendPendingEmail } from '@documenso/lib/server-only/document/send-pending-email';
import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZAdminResendEmailRequestSchema,
  ZAdminResendEmailResponseSchema,
} from './admin-resend-email.types';

export const adminResendEmailRoute = adminProcedure
  .input(ZAdminResendEmailRequestSchema)
  .output(ZAdminResendEmailResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { envelopeId, recipientId } = input;

    ctx.logger.info({ input: { envelopeId, recipientId } });

    const recipient = await prisma.recipient.findFirst({
      where: {
        id: recipientId,
        envelope: {
          id: envelopeId,
        },
      },
    });

    if (!recipient) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: 'Recipient not found for the given document',
      });
    }

    await sendPendingEmail({
      id: {
        type: 'envelopeId',
        id: envelopeId,
      },
      recipientId,
    });

    return { success: true };
  });
