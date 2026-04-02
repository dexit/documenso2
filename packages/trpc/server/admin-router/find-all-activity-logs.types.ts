import { z } from 'zod';

import {
  ZDocumentAuditLogSchema,
  ZDocumentAuditLogTypeSchema,
} from '@documenso/lib/types/document-audit-logs';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZFindAllActivityLogsRequestSchema = ZFindSearchParamsSchema.extend({
  type: ZDocumentAuditLogTypeSchema.optional(),
  email: z.string().optional(),
  teamId: z.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderByColumn: z.enum(['createdAt', 'type', 'email']).optional().default('createdAt'),
  orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  perPage: z.number().optional().default(50),
});

export const ZEnvelopeInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  secondaryId: z.string(),
  userId: z.number(),
  teamId: z.number().nullable(),
  team: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable(),
});

export const ZActivityLogWithEnvelopeSchema = ZDocumentAuditLogSchema.and(
  z.object({
    envelope: ZEnvelopeInfoSchema.nullable(),
    signingLink: z.string().nullable(),
  }),
);

export const ZFindAllActivityLogsResponseSchema = ZFindResultResponse.extend({
  data: ZActivityLogWithEnvelopeSchema.array(),
});

export type TFindAllActivityLogsRequest = z.infer<typeof ZFindAllActivityLogsRequestSchema>;
export type TFindAllActivityLogsResponse = z.infer<typeof ZFindAllActivityLogsResponseSchema>;
export type TActivityLogWithEnvelope = z.infer<typeof ZActivityLogWithEnvelopeSchema>;
