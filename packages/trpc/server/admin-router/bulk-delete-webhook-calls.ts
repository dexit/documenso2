import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteWebhookCallsMeta,
  ZBulkDeleteWebhookCallsRequestSchema,
  ZBulkDeleteWebhookCallsResponseSchema,
} from './bulk-delete-webhook-calls.types';

export const bulkDeleteWebhookCallsRoute = adminProcedure
  .meta(bulkDeleteWebhookCallsMeta)
  .input(ZBulkDeleteWebhookCallsRequestSchema)
  .output(ZBulkDeleteWebhookCallsResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    const result = await prisma.webhookCall.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  });
