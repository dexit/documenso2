import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteUsersMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteUsersRequestSchema = z.object({
  ids: z.array(z.number()),
});

export const ZBulkDeleteUsersResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteUsersRequest = z.infer<typeof ZBulkDeleteUsersRequestSchema>;
export type TBulkDeleteUsersResponse = z.infer<typeof ZBulkDeleteUsersResponseSchema>;
