import { z } from 'zod';

export const ZAdminUpdateDocumentMetaRequestSchema = z.object({
  envelopeId: z.string(),
  subject: z.string().optional(),
  message: z.string().optional(),
});

export const ZAdminUpdateDocumentMetaResponseSchema = z.object({
  success: z.boolean(),
});

export type TAdminUpdateDocumentMetaRequest = z.infer<
  typeof ZAdminUpdateDocumentMetaRequestSchema
>;
export type TAdminUpdateDocumentMetaResponse = z.infer<
  typeof ZAdminUpdateDocumentMetaResponseSchema
>;
