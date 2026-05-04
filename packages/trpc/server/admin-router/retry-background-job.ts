import { z } from 'zod';
import { prisma } from '@documenso/prisma';
import { adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const retryBackgroundJobRoute = adminProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const job = await prisma.backgroundJob.findUnique({
      where: { id: input.id },
    });

    if (!job) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Background job not found',
      });
    }

    await prisma.backgroundJob.update({
      where: { id: input.id },
      data: {
        status: 'PENDING',
        retried: { increment: 1 },
      },
    });

    return { success: true };
  });
