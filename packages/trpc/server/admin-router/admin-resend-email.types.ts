import { z } from 'zod';

export const ZAdminResendEmailRequestSchema = z.object({
  envelopeId: z.string(),
  recipientId: z.number(),
});

export const ZAdminResendEmailResponseSchema = z.object({
  success: z.boolean(),
});

export type TAdminResendEmailRequest = z.infer<typeof ZAdminResendEmailRequestSchema>;
export type TAdminResendEmailResponse = z.infer<typeof ZAdminResendEmailResponseSchema>;
