import { z } from 'zod';

import { ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZFindWebhookLogsRequestSchema = ZFindSearchParamsSchema.extend({
  status: z.enum(['SUCCESS', 'FAILED']).optional(),
  teamId: z.number().optional(),
  query: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  perPage: z.number().optional().default(50),
});

export const ZWebhookCallRowSchema = z.object({
  id: z.string(),
  status: z.string(),
  url: z.string(),
  event: z.string(),
  responseCode: z.number(),
  requestBody: z.unknown(),
  responseBody: z.unknown().nullable(),
  responseHeaders: z.unknown().nullable(),
  createdAt: z.date(),
  webhookId: z.string(),
  webhookUrl: z.string(),
  webhookEnabled: z.boolean(),
  teamId: z.number(),
  teamName: z.string().nullable(),
  ownerName: z.string().nullable(),
  ownerEmail: z.string().nullable(),
});

export const ZFindWebhookLogsResponseSchema = z.object({
  data: ZWebhookCallRowSchema.array(),
  count: z.number(),
  currentPage: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export type TFindWebhookLogsRequest = z.infer<typeof ZFindWebhookLogsRequestSchema>;
export type TFindWebhookLogsResponse = z.infer<typeof ZFindWebhookLogsResponseSchema>;
export type TWebhookCallRow = z.infer<typeof ZWebhookCallRowSchema>;
