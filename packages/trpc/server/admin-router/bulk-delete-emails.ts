import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteEmailsMeta,
  ZBulkDeleteEmailsRequestSchema,
  ZBulkDeleteEmailsResponseSchema,
} from './bulk-delete-emails.types';

export const bulkDeleteEmailsRoute = adminProcedure
  .meta(bulkDeleteEmailsMeta)
  .input(ZBulkDeleteEmailsRequestSchema)
  .output(ZBulkDeleteEmailsResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    const result = await prisma.email.deleteMany({
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
