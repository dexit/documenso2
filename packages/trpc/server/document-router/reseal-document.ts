import { resealDocument } from '@documenso/lib/server-only/document/reseal-document';

import { ZGenericSuccessResponse } from '../schema';
import { authenticatedProcedure } from '../trpc';
import {
  ZResealDocumentRequestSchema,
  ZResealDocumentResponseSchema,
  resealDocumentMeta,
} from './reseal-document.types';

export const resealDocumentRoute = authenticatedProcedure
  .meta(resealDocumentMeta)
  .input(ZResealDocumentRequestSchema)
  .output(ZResealDocumentResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { teamId } = ctx;
    const { envelopeId } = input;

    ctx.logger.info({
      input: {
        envelopeId,
      },
    });

    await resealDocument({
      userId: ctx.user.id,
      teamId,
      id: {
        type: 'envelopeId',
        id: envelopeId,
      },
    });

    return ZGenericSuccessResponse;
  });
