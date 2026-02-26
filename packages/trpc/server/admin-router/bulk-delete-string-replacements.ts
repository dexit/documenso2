import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteStringReplacementsMeta,
  ZBulkDeleteStringReplacementsRequestSchema,
  ZBulkDeleteStringReplacementsResponseSchema,
} from './bulk-delete-string-replacements.types';

export const bulkDeleteStringReplacementsRoute = adminProcedure
  .meta(bulkDeleteStringReplacementsMeta)
  .input(ZBulkDeleteStringReplacementsRequestSchema)
  .output(ZBulkDeleteStringReplacementsResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    const result = await prisma.stringReplacement.deleteMany({
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
