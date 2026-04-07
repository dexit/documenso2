import { z } from 'zod';

export const ZFindAdminWebhooksRequestSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(20),
  query: z.string().optional(),
  enabled: z.boolean().optional(),
  teamId: z.number().optional(),
});

export const ZAdminWebhookRowSchema = z.object({
  id: z.string(),
  webhookUrl: z.string(),
  eventTriggers: z.array(z.string()),
  enabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.number(),
  teamId: z.number(),
  team: z.object({
    id: z.number(),
    name: z.string(),
    url: z.string(),
  }),
  user: z.object({
    id: z.number(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  _count: z.object({
    webhookCalls: z.number(),
  }),
  lastCallStatus: z.string().nullable(),
  lastCallAt: z.date().nullable(),
});

export const ZFindAdminWebhooksResponseSchema = z.object({
  data: z.array(ZAdminWebhookRowSchema),
  count: z.number(),
  currentPage: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export type TFindAdminWebhooksRequest = z.infer<typeof ZFindAdminWebhooksRequestSchema>;
export type TAdminWebhookRow = z.infer<typeof ZAdminWebhookRowSchema>;
export type TFindAdminWebhooksResponse = z.infer<typeof ZFindAdminWebhooksResponseSchema>;
