import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const retryJobMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/admin/job/retry',
    summary: 'Retry Background Job',
    description: 'Retry a failed background job',
    tags: ['Admin'],
  },
};

export const ZRetryJobRequestSchema = z.object({
  id: z.string(),
});

export const ZRetryJobResponseSchema = z.object({
  success: z.boolean(),
});

export type TRetryJobRequest = z.infer<typeof ZRetryJobRequestSchema>;
export type TRetryJobResponse = z.infer<typeof ZRetryJobResponseSchema>;
