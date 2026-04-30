import { z } from 'zod';

import { ZSuccessResponseSchema } from '../schema';
import type { TrpcRouteMeta } from '../trpc';

export const resealDocumentMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/document/reseal',
    summary: 'Reseal document',
    tags: ['Document'],
  },
};

export const ZResealDocumentRequestSchema = z.object({
  envelopeId: z.string(),
});

export const ZResealDocumentResponseSchema = ZSuccessResponseSchema;

export type TResealDocumentRequest = z.infer<typeof ZResealDocumentRequestSchema>;
export type TResealDocumentResponse = z.infer<typeof ZResealDocumentResponseSchema>;
