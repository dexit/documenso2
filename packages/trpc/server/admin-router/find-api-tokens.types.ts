import { z } from 'zod';

import { ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZFindApiTokensRequestSchema = ZFindSearchParamsSchema.extend({
  teamId: z.number().optional(),
  query: z.string().optional(),
  orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  perPage: z.number().optional().default(50),
});

export const ZApiTokenRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  algorithm: z.string(),
  expires: z.date().nullable(),
  createdAt: z.date(),
  teamId: z.number(),
  teamName: z.string().nullable(),
  userName: z.string().nullable(),
  userEmail: z.string().nullable(),
  userId: z.number().nullable(),
  isExpired: z.boolean(),
});

export const ZFindApiTokensResponseSchema = z.object({
  data: ZApiTokenRowSchema.array(),
  count: z.number(),
  currentPage: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export type TFindApiTokensRequest = z.infer<typeof ZFindApiTokensRequestSchema>;
export type TFindApiTokensResponse = z.infer<typeof ZFindApiTokensResponseSchema>;
export type TApiTokenRow = z.infer<typeof ZApiTokenRowSchema>;
