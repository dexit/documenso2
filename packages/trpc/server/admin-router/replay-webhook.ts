import { z } from 'zod';
import { prisma } from '@documenso/prisma';
import { adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { jobs } from '@documenso/lib/jobs/client';

export const replayWebhookRoute = adminProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const webhookCall = await prisma.webhookCall.findUnique({
      where: { id: input.id },
    });

    if (!webhookCall) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Webhook call not found',
      });
    }

    await jobs.triggerJob({
      name: 'internal.execute-webhook',
      payload: {
        event: webhookCall.event,
        webhookId: webhookCall.webhookId,
        data: webhookCall.requestBody as any,
      },
    });

    return { success: true };
  });
