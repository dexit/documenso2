import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';

export const bulkDeleteJobsRoute = adminProcedure
  .input(z.object({ ids: z.array(z.string()) }))
  .mutation(async ({ input }) => {
    return await prisma.backgroundJob.deleteMany({
      where: { id: { in: input.ids } },
    });
  });
