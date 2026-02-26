import { z } from 'zod';

import { ZFindResultResponse } from '@documenso/lib/types/search-params';
import type { TrpcRouteMeta } from '../trpc';

export const findAllWebhookCallsMeta: TrpcRouteMeta = {
  openapi: {
    method: 'GET',
    path: '/admin/webhook/findAllCalls',
    summary: 'Find All Webhook Calls',
    description: 'Find all webhook calls with pagination',
    tags: ['Admin'],
  },
};

export const ZFindAllWebhookCallsRequestSchema = z.object({
  page: z.number().min(1).optional().default(1),
  perPage: z.number().min(1).max(100).optional().default(10),
});

export const ZFindAllWebhookCallsResponseSchema = ZFindResultResponse.extend({
  data: z.array(z.any()),
});

export type TFindAllWebhookCallsRequest = z.infer<typeof ZFindAllWebhookCallsRequestSchema>;
export type TFindAllWebhookCallsResponse = z.infer<typeof ZFindAllWebhookCallsResponseSchema>;
