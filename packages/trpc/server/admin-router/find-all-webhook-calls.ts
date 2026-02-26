import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';

export const findAllWebhookCallsRoute = adminProcedure
  .input(
    z.object({
      page: z.number().min(1).optional().default(1),
      perPage: z.number().min(1).max(100).optional().default(10),
    }),
  )
  .query(async ({ input }) => {
    const { page, perPage } = input;

    const [data, totalCount] = await Promise.all([
      prisma.webhookCall.findMany({
        take: perPage,
        skip: (page - 1) * perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          webhook: {
            include: {
              team: { select: { name: true } },
            },
          },
        },
      }),
      prisma.webhookCall.count(),
    ]);

    return {
      data,
      currentPage: page,
      perPage,
      totalPages: Math.ceil(totalCount / perPage),
    };
  });
