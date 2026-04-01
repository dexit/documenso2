import { z } from 'zod';

import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZFindRecipientStatsRequestSchema = ZFindSearchParamsSchema.extend({
  perPage: z.number().optional().default(50),
});

export const ZRecipientStatSchema = z.object({
  email: z.string(),
  name: z.string(),
  totalDocuments: z.number(),
  completedDocuments: z.number(),
  pendingDocuments: z.number(),
  rejectedDocuments: z.number(),
  lastActivity: z.date().nullable(),
});

export const ZFindRecipientStatsResponseSchema = ZFindResultResponse.extend({
  data: ZRecipientStatSchema.array(),
});

export type TFindRecipientStatsRequest = z.infer<typeof ZFindRecipientStatsRequestSchema>;
export type TFindRecipientStatsResponse = z.infer<typeof ZFindRecipientStatsResponseSchema>;
export type TRecipientStat = z.infer<typeof ZRecipientStatSchema>;
