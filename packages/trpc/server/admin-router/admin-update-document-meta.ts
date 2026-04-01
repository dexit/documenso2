import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZAdminUpdateDocumentMetaRequestSchema,
  ZAdminUpdateDocumentMetaResponseSchema,
} from './admin-update-document-meta.types';

export const adminUpdateDocumentMetaRoute = adminProcedure
  .input(ZAdminUpdateDocumentMetaRequestSchema)
  .output(ZAdminUpdateDocumentMetaResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { envelopeId, subject, message } = input;

    ctx.logger.info({ input: { envelopeId } });

    const envelope = await prisma.envelope.findFirst({
      where: { id: envelopeId },
      include: { documentMeta: true },
    });

    if (!envelope) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: 'Document not found',
      });
    }

    await prisma.documentMeta.update({
      where: { id: envelope.documentMetaId },
      data: {
        ...(subject !== undefined && { subject }),
        ...(message !== undefined && { message }),
      },
    });

    return { success: true };
  });
