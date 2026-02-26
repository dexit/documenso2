import { z } from 'zod';

export const ZRetryWebhookCallRequestSchema = z.object({
  webhookCallId: z.string(),
});

export type TRetryWebhookCallRequest = z.infer<typeof ZRetryWebhookCallRequestSchema>;
