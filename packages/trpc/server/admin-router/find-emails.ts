import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  findEmailsMeta,
  ZFindEmailsRequestSchema,
  ZFindEmailsResponseSchema,
} from './find-emails.types';

export const findEmailsRoute = adminProcedure
  .meta(findEmailsMeta)
  .input(ZFindEmailsRequestSchema)
  .output(ZFindEmailsResponseSchema)
  .query(async ({ input }) => {
    const { page, perPage } = input;

    const [data, totalCount] = await Promise.all([
      prisma.email.findMany({
        take: perPage,
        skip: (page - 1) * perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          interactions: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.email.count(),
    ]);

    return {
      data,
      currentPage: page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    };
  });
