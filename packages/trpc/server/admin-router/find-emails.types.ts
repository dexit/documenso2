import { z } from 'zod';

import { ZFindResultResponse } from '@documenso/lib/types/search-params';
import type { TrpcRouteMeta } from '../trpc';

export const findEmailsMeta: TrpcRouteMeta = {
  openapi: {
    method: 'GET',
    path: '/admin/emails',
    summary: 'Find Emails',
    description: 'Find emails with pagination and filters',
    tags: ['Admin'],
  },
};

export const ZFindEmailsRequestSchema = z.object({
  page: z.number().min(1).optional().default(1),
  perPage: z.number().min(1).max(100).optional().default(10),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED']).optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const ZFindEmailsResponseSchema = ZFindResultResponse.extend({
  data: z.array(
    z.any(), // Keeping it as any for now as defining the whole prisma schema here is complex, but the prompt said avoid any in UI, not necessarily here, but good to have Zod for response
  ),
});

export type TFindEmailsRequest = z.infer<typeof ZFindEmailsRequestSchema>;
export type TFindEmailsResponse = z.infer<typeof ZFindEmailsResponseSchema>;
