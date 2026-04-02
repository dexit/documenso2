import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZFindWebhookLogsRequestSchema,
  ZFindWebhookLogsResponseSchema,
} from './find-webhook-logs.types';

export const findWebhookLogsRoute = adminProcedure
  .input(ZFindWebhookLogsRequestSchema)
  .output(ZFindWebhookLogsResponseSchema)
  .query(async ({ input }) => {
    const { page = 1, perPage = 50, status, teamId, query, dateFrom, dateTo, orderByDirection = 'desc' } = input;

    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    const webhookWhere: Record<string, unknown> = {};
    if (teamId) webhookWhere.teamId = teamId;
    if (query) webhookWhere.webhookUrl = { contains: query, mode: 'insensitive' };
    if (Object.keys(webhookWhere).length > 0) where.webhook = webhookWhere;

    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const [data, count] = await Promise.all([
      prisma.webhookCall.findMany({
        where,
        skip: Math.max(page - 1, 0) * perPage,
        take: perPage,
        orderBy: { createdAt: orderByDirection },
        include: {
          webhook: {
            select: {
              id: true,
              webhookUrl: true,
              enabled: true,
              teamId: true,
              team: { select: { name: true } },
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      prisma.webhookCall.count({ where }),
    ]);

    type WebhookCallRow = typeof data[number];

    const result = (data as WebhookCallRow[]).map((call) => ({
      id: call.id,
      status: call.status as string,
      url: call.url,
      event: call.event as string,
      responseCode: call.responseCode,
      requestBody: call.requestBody,
      responseBody: call.responseBody,
      responseHeaders: call.responseHeaders,
      createdAt: call.createdAt,
      webhookId: call.webhookId,
      webhookUrl: (call.webhook as { webhookUrl: string }).webhookUrl,
      webhookEnabled: (call.webhook as { enabled: boolean }).enabled,
      teamId: (call.webhook as { teamId: number }).teamId,
      teamName: (call.webhook as { team: { name: string } | null }).team?.name ?? null,
      ownerName: (call.webhook as { user: { name: string | null; email: string } | null }).user?.name ?? null,
      ownerEmail: (call.webhook as { user: { name: string | null; email: string } | null }).user?.email ?? null,
    }));

    return {
      data: result,
      count: count as number,
      currentPage: Math.max(page, 1),
      perPage,
      totalPages: Math.ceil((count as number) / perPage),
    };
  });
