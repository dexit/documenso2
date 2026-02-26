import { BackgroundJobStatus } from '@prisma/client';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  retryJobMeta,
  ZRetryJobRequestSchema,
  ZRetryJobResponseSchema,
} from './retry-job.types';

export const retryJobRoute = adminProcedure
  .meta(retryJobMeta)
  .input(ZRetryJobRequestSchema)
  .output(ZRetryJobResponseSchema)
  .mutation(async ({ input }) => {
    await prisma.backgroundJob.update({
      where: { id: input.id },
      data: {
        status: BackgroundJobStatus.PENDING,
        retried: 0,
        lastRetriedAt: null,
      },
    });

    return { success: true };
  });
