import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';

export const bulkDeleteWebhookCallsRoute = adminProcedure
  .input(z.object({ ids: z.array(z.string()) }))
  .mutation(async ({ input }) => {
    return await prisma.webhookCall.deleteMany({
      where: { id: { in: input.ids } },
    });
  });
