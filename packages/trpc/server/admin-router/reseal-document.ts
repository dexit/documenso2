import { resealDocument } from '@documenso/lib/server-only/document/reseal-document';

import { adminProcedure } from '../trpc';
import {
  ZResealDocumentRequestSchema,
  ZResealDocumentResponseSchema,
} from './reseal-document.types';

export const resealDocumentRoute = adminProcedure
  .input(ZResealDocumentRequestSchema)
  .output(ZResealDocumentResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { id } = input;

    ctx.logger.info({
      input: {
        id,
      },
    });

    await resealDocument({
      userId: ctx.user.id,
      teamId: -1, // Admins bypass team check in the library function.
      id: {
        type: 'envelopeId',
        id,
      },
    });
  });
