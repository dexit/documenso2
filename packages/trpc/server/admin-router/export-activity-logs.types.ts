import { z } from 'zod';

import { ZDocumentAuditLogTypeSchema } from '@documenso/lib/types/document-audit-logs';

export const ZExportActivityLogsRequestSchema = z.object({
  type: ZDocumentAuditLogTypeSchema.optional(),
  email: z.string().optional(),
  teamId: z.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const ZExportActivityLogsResponseSchema = z.object({
  csv: z.string(),
  filename: z.string(),
  count: z.number(),
});

export type TExportActivityLogsRequest = z.infer<typeof ZExportActivityLogsRequestSchema>;
export type TExportActivityLogsResponse = z.infer<typeof ZExportActivityLogsResponseSchema>;
