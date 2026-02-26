import { z } from 'zod';

import { ZFindResultResponse } from '@documenso/lib/types/search-params';
import type { TrpcRouteMeta } from '../trpc';

export const findStringReplacementsMeta: TrpcRouteMeta = {
  openapi: {
    method: 'GET',
    path: '/admin/string-replacement/find',
    summary: 'Find String Replacements',
    description: 'Find string replacements with pagination',
    tags: ['Admin'],
  },
};

export const ZFindStringReplacementsRequestSchema = z.object({
  page: z.number().min(1).optional().default(1),
  perPage: z.number().min(1).max(100).optional().default(10),
});

export const ZFindStringReplacementsResponseSchema = ZFindResultResponse.extend({
  data: z.array(z.any()),
});

export type TFindStringReplacementsRequest = z.infer<typeof ZFindStringReplacementsRequestSchema>;
export type TFindStringReplacementsResponse = z.infer<typeof ZFindStringReplacementsResponseSchema>;
