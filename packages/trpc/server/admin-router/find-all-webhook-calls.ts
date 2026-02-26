import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import {
  findAllWebhookCallsMeta,
  ZFindAllWebhookCallsRequestSchema,
  ZFindAllWebhookCallsResponseSchema,
} from './find-all-webhook-calls.types';

export const findAllWebhookCallsRoute = adminProcedure
  .meta(findAllWebhookCallsMeta)
  .input(ZFindAllWebhookCallsRequestSchema)
  .output(ZFindAllWebhookCallsResponseSchema)
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
