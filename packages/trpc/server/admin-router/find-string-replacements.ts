import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  findStringReplacementsMeta,
  ZFindStringReplacementsRequestSchema,
  ZFindStringReplacementsResponseSchema,
} from './find-string-replacements.types';

export const findStringReplacementsRoute = adminProcedure
  .meta(findStringReplacementsMeta)
  .input(ZFindStringReplacementsRequestSchema)
  .output(ZFindStringReplacementsResponseSchema)
  .query(async ({ input }) => {
    const { page, perPage } = input;

    const [data, totalCount] = await Promise.all([
      prisma.stringReplacement.findMany({
        take: perPage,
        skip: (page - 1) * perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stringReplacement.count(),
    ]);

    return {
      data,
      currentPage: page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    };
  });
