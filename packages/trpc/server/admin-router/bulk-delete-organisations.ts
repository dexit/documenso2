import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteOrganisationsMeta,
  ZBulkDeleteOrganisationsRequestSchema,
  ZBulkDeleteOrganisationsResponseSchema,
} from './bulk-delete-organisations.types';

export const bulkDeleteOrganisationsRoute = adminProcedure
  .meta(bulkDeleteOrganisationsMeta)
  .input(ZBulkDeleteOrganisationsRequestSchema)
  .output(ZBulkDeleteOrganisationsResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    const result = await prisma.organisation.deleteMany({
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
