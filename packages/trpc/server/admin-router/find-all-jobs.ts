import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';

export const findAllJobsRoute = adminProcedure
  .input(
    z.object({
      page: z.number().min(1).optional().default(1),
      perPage: z.number().min(1).max(100).optional().default(10),
    }),
  )
  .query(async ({ input }) => {
    const { page, perPage } = input;

    const [data, totalCount] = await Promise.all([
      prisma.backgroundJob.findMany({
        take: perPage,
        skip: (page - 1) * perPage,
        orderBy: { submittedAt: 'desc' },
        include: {
          tasks: true,
        },
      }),
      prisma.backgroundJob.count(),
    ]);

    return {
      data,
      count: totalCount,
      currentPage: page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    };
  });
