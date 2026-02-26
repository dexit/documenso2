import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteDocumentsMeta,
  ZBulkDeleteDocumentsRequestSchema,
  ZBulkDeleteDocumentsResponseSchema,
} from './bulk-delete-documents.types';

export const bulkDeleteDocumentsRoute = adminProcedure
  .meta(bulkDeleteDocumentsMeta)
  .input(ZBulkDeleteDocumentsRequestSchema)
  .output(ZBulkDeleteDocumentsResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    const result = await prisma.envelope.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  });
