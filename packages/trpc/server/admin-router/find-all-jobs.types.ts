import { z } from 'zod';

import { ZFindResultResponse } from '@documenso/lib/types/search-params';
import type { TrpcRouteMeta } from '../trpc';

export const findAllJobsMeta: TrpcRouteMeta = {
  openapi: {
    method: 'GET',
    path: '/admin/job/findAll',
    summary: 'Find All Background Jobs',
    description: 'Find all background jobs with pagination',
    tags: ['Admin'],
  },
};

export const ZFindAllJobsRequestSchema = z.object({
  page: z.number().min(1).optional().default(1),
  perPage: z.number().min(1).max(100).optional().default(10),
});

export const ZFindAllJobsResponseSchema = ZFindResultResponse.extend({
  data: z.array(z.any()),
});

export type TFindAllJobsRequest = z.infer<typeof ZFindAllJobsRequestSchema>;
export type TFindAllJobsResponse = z.infer<typeof ZFindAllJobsResponseSchema>;
