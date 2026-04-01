import { z } from 'zod';

import { ZDocumentAuditLogEmailTypeSchema } from '@documenso/lib/types/document-audit-logs';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZFindEmailActivityRequestSchema = ZFindSearchParamsSchema.extend({
  perPage: z.number().optional().default(50),
  emailType: ZDocumentAuditLogEmailTypeSchema.optional(),
  teamId: z.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const ZEmailActivityEntrySchema = z.object({
  id: z.string(),
  envelopeId: z.string(),
  sentAt: z.date(),
  recipientEmail: z.string(),
  recipientName: z.string(),
  recipientId: z.number(),
  recipientRole: z.string(),
  emailType: z.string(),
  isResending: z.boolean(),
  openCount: z.number(),
  lastOpenedAt: z.date().nullable(),
  documentTitle: z.string(),
  documentId: z.string(),
  teamName: z.string().nullable(),
  signingLink: z.string().nullable(),
  senderName: z.string().nullable(),
  senderEmail: z.string().nullable(),
});

export const ZFindEmailActivityResponseSchema = ZFindResultResponse.extend({
  data: ZEmailActivityEntrySchema.array(),
  stats: z.object({
    totalSent: z.number(),
    totalOpened: z.number(),
    openRate: z.number(),
  }),
});

export type TFindEmailActivityRequest = z.infer<typeof ZFindEmailActivityRequestSchema>;
export type TFindEmailActivityResponse = z.infer<typeof ZFindEmailActivityResponseSchema>;
export type TEmailActivityEntry = z.infer<typeof ZEmailActivityEntrySchema>;
