import { z } from 'zod';

import { ZDocumentAuditLogSchema, ZDocumentAuditLogTypeSchema } from '@documenso/lib/types/document-audit-logs';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZFindAllActivityLogsRequestSchema = ZFindSearchParamsSchema.extend({
  type: ZDocumentAuditLogTypeSchema.optional(),
  envelopeId: z.string().optional(),
  email: z.string().optional(),
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).optional(),
  perPage: z.number().optional().default(50),
});

export const ZActivityLogWithEnvelopeSchema = ZDocumentAuditLogSchema.and(
  z.object({
    envelope: z
      .object({
        id: z.string(),
        title: z.string(),
        secondaryId: z.string(),
        userId: z.number(),
        teamId: z.number(),
      })
      .optional()
      .nullable(),
  }),
);

export const ZFindAllActivityLogsResponseSchema = ZFindResultResponse.extend({
  data: ZActivityLogWithEnvelopeSchema.array(),
});

export type TFindAllActivityLogsRequest = z.infer<typeof ZFindAllActivityLogsRequestSchema>;
export type TFindAllActivityLogsResponse = z.infer<typeof ZFindAllActivityLogsResponseSchema>;
export type TActivityLogWithEnvelope = z.infer<typeof ZActivityLogWithEnvelopeSchema>;
