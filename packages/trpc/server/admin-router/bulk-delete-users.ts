import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  bulkDeleteUsersMeta,
  ZBulkDeleteUsersRequestSchema,
  ZBulkDeleteUsersResponseSchema,
} from './bulk-delete-users.types';

export const bulkDeleteUsersRoute = adminProcedure
  .meta(bulkDeleteUsersMeta)
  .input(ZBulkDeleteUsersRequestSchema)
  .output(ZBulkDeleteUsersResponseSchema)
  .mutation(async ({ input }) => {
    const { ids } = input;

    const result = await prisma.user.deleteMany({
      where: {
        id: {
          in: ids,
        },
        NOT: {
          roles: {
            has: 'ADMIN',
          },
        },
      },
    });

    return {
      success: true,
      deletedCount: result.count,
    };
  });
