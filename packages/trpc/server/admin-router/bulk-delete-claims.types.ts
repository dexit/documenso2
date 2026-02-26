import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteClaimsMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteClaimsRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const ZBulkDeleteClaimsResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteClaimsRequest = z.infer<typeof ZBulkDeleteClaimsRequestSchema>;
export type TBulkDeleteClaimsResponse = z.infer<typeof ZBulkDeleteClaimsResponseSchema>;
