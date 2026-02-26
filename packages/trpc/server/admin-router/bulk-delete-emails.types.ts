import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteEmailsMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteEmailsRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const ZBulkDeleteEmailsResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteEmailsRequest = z.infer<typeof ZBulkDeleteEmailsRequestSchema>;
export type TBulkDeleteEmailsResponse = z.infer<typeof ZBulkDeleteEmailsResponseSchema>;
