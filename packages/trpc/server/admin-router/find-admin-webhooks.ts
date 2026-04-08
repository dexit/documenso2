import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZFindAdminWebhooksRequestSchema,
} from './find-admin-webhooks.types';

export const findAdminWebhooksRoute = adminProcedure
  .input(ZFindAdminWebhooksRequestSchema)
  .query(async ({ input }) => {
    const { page = 1, perPage = 20, query, enabled, teamId } = input;

    const where: Record<string, unknown> = {};

    if (query) {
      where.webhookUrl = { contains: query, mode: 'insensitive' };
    }

    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    if (teamId !== undefined) {
      where.teamId = teamId;
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          team: { select: { id: true, name: true, url: true } },
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { webhookCalls: true } },
          webhookCalls: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true, createdAt: true },
          },
        },
      }),
      prisma.webhook.count({ where }),
    ]);

    const data = webhooks.map((w) => ({
      id: w.id,
      webhookUrl: w.webhookUrl,
      eventTriggers: w.eventTriggers as string[],
      enabled: w.enabled,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      userId: w.userId,
      teamId: w.teamId,
      team: w.team,
      user: w.user,
      _count: { webhookCalls: w._count.webhookCalls },
      lastCallStatus: w.webhookCalls[0]?.status ?? null,
      lastCallAt: w.webhookCalls[0]?.createdAt ?? null,
    }));

    return {
      data,
      count: total,
      currentPage: page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  });
