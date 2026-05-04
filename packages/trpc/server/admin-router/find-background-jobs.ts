import { z } from 'zod';
import { prisma } from '@documenso/prisma';
import { adminProcedure } from '../trpc';

export const findBackgroundJobsRoute = adminProcedure
  .input(
    z.object({
      page: z.number().min(1).default(1),
      perPage: z.number().min(1).max(100).default(20),
    }),
  )
  .query(async ({ input }) => {
    const { page, perPage } = input;

    const [data, total] = await Promise.all([
      prisma.backgroundJob.findMany({
        include: {
          tasks: true,
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.backgroundJob.count(),
    ]);

    return {
      data,
      total,
    };
  });
