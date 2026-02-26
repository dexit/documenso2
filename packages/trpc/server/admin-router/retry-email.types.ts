import { z } from 'zod';

import type { TrpcRouteMeta } from '../trpc';

export const retryEmailMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/admin/email/retry',
    summary: 'Retry Email',
    description: 'Retry sending a failed email',
    tags: ['Admin'],
  },
};

export const ZRetryEmailRequestSchema = z.object({
  id: z.string(),
});

export const ZRetryEmailResponseSchema = z.object({
  success: z.boolean(),
});

export type TRetryEmailRequest = z.infer<typeof ZRetryEmailRequestSchema>;
export type TRetryEmailResponse = z.infer<typeof ZRetryEmailResponseSchema>;
