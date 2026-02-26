import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  findAllJobsMeta,
  ZFindAllJobsRequestSchema,
  ZFindAllJobsResponseSchema,
} from './find-all-jobs.types';

export const findAllJobsRoute = adminProcedure
  .meta(findAllJobsMeta)
  .input(ZFindAllJobsRequestSchema)
  .output(ZFindAllJobsResponseSchema)
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
      currentPage: page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    };
  });
