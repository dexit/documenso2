import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteWebhookCallsMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteWebhookCallsRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const ZBulkDeleteWebhookCallsResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteWebhookCallsRequest = z.infer<typeof ZBulkDeleteWebhookCallsRequestSchema>;
export type TBulkDeleteWebhookCallsResponse = z.infer<typeof ZBulkDeleteWebhookCallsResponseSchema>;
