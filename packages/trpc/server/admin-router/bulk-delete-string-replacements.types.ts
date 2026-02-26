import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteStringReplacementsMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteStringReplacementsRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const ZBulkDeleteStringReplacementsResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteStringReplacementsRequest = z.infer<typeof ZBulkDeleteStringReplacementsRequestSchema>;
export type TBulkDeleteStringReplacementsResponse = z.infer<typeof ZBulkDeleteStringReplacementsResponseSchema>;
