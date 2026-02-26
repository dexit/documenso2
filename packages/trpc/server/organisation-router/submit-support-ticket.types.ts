import { z } from 'zod';

export const ZSubmitSupportTicketRequestSchema = z.object({
  orgUrl: z.string(),
  values: z.record(z.any()),
});

export const ZSubmitSupportTicketResponseSchema = z.object({
  success: z.boolean(),
});

export type TSubmitSupportTicketRequest = z.infer<typeof ZSubmitSupportTicketRequestSchema>;
export type TSubmitSupportTicketResponse = z.infer<typeof ZSubmitSupportTicketResponseSchema>;
