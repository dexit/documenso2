import { z } from 'zod';

const ZCountWithPeriodSchema = z.object({
  total: z.number(),
  today: z.number(),
  thisWeek: z.number(),
});

export const ZGetActivityStatsResponseSchema = z.object({
  emails: z.object({
    sent: ZCountWithPeriodSchema,
    opened: ZCountWithPeriodSchema,
    openRate: z.number(), // percentage 0-100
  }),
  signRequests: z.object({
    total: z.number(),
    completed: z.number(),
    pending: z.number(),
    rejected: z.number(),
  }),
  activities: z.object({
    today: z.number(),
    thisWeek: z.number(),
    total: z.number(),
  }),
});

export type TGetActivityStatsResponse = z.infer<typeof ZGetActivityStatsResponseSchema>;
