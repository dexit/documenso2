import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const upsertStringReplacementMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/admin/string-replacement/upsert',
    summary: 'Upsert String Replacement',
    description: 'Create or update a string replacement',
    tags: ['Admin'],
  },
};

export const ZUpsertStringReplacementRequestSchema = z.object({
  id: z.string().optional(),
  original: z.string().min(1),
  replacement: z.string(),
});

export const ZUpsertStringReplacementResponseSchema = z.any();

export type TUpsertStringReplacementRequest = z.infer<typeof ZUpsertStringReplacementRequestSchema>;
export type TUpsertStringReplacementResponse = z.infer<typeof ZUpsertStringReplacementResponseSchema>;
