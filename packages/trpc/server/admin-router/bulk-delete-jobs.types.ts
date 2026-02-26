import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteJobsMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteJobsRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const ZBulkDeleteJobsResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteJobsRequest = z.infer<typeof ZBulkDeleteJobsRequestSchema>;
export type TBulkDeleteJobsResponse = z.infer<typeof ZBulkDeleteJobsResponseSchema>;
