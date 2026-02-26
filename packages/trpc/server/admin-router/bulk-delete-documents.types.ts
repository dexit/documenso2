import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteDocumentsMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteDocumentsRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const ZBulkDeleteDocumentsResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteDocumentsRequest = z.infer<typeof ZBulkDeleteDocumentsRequestSchema>;
export type TBulkDeleteDocumentsResponse = z.infer<typeof ZBulkDeleteDocumentsResponseSchema>;
