import { z } from 'zod';
import { BackgroundJobStatus } from '@prisma/client';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';

export const retryJobRoute = adminProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    return await prisma.backgroundJob.update({
      where: { id: input.id },
      data: {
        status: BackgroundJobStatus.PENDING,
        retried: 0,
        lastRetriedAt: null,
      },
    });
  });
