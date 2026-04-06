import { z } from 'zod';

import { ZDocumentManySchema } from '@documenso/lib/types/document';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZFindDocumentsRequestSchema = ZFindSearchParamsSchema.extend({
  perPage: z.number().optional().default(20),
  status: z.enum(['DRAFT', 'PENDING', 'COMPLETED', 'REJECTED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  teamId: z.number().optional(),
  ownerEmail: z.string().optional(),
  orderBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const ZFindDocumentsResponseSchema = ZFindResultResponse.extend({
  data: ZDocumentManySchema.array(),
});

export type TFindDocumentsRequest = z.infer<typeof ZFindDocumentsRequestSchema>;
export type TFindDocumentsResponse = z.infer<typeof ZFindDocumentsResponseSchema>;
