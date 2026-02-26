import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteJobsMeta,
  ZBulkDeleteJobsRequestSchema,
  ZBulkDeleteJobsResponseSchema,
} from './bulk-delete-jobs.types';

export const bulkDeleteJobsRoute = adminProcedure
  .meta(bulkDeleteJobsMeta)
  .input(ZBulkDeleteJobsRequestSchema)
  .output(ZBulkDeleteJobsResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    const result = await prisma.job.deleteMany({
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
