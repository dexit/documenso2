import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteClaimsMeta,
  ZBulkDeleteClaimsRequestSchema,
  ZBulkDeleteClaimsResponseSchema,
} from './bulk-delete-claims.types';

export const bulkDeleteClaimsRoute = adminProcedure
  .meta(bulkDeleteClaimsMeta)
  .input(ZBulkDeleteClaimsRequestSchema)
  .output(ZBulkDeleteClaimsResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    // We don't delete locked claims in bulk
    const result = await prisma.subscriptionClaim.deleteMany({
      where: {
        id: {
          in: ids,
        },
        locked: false,
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  });
