import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';

export const bulkDeleteEmailsRoute = adminProcedure
  .input(z.object({ ids: z.array(z.string()) }))
  .mutation(async ({ input }) => {
    return await prisma.email.deleteMany({
      where: { id: { in: input.ids } },
    });
  });
