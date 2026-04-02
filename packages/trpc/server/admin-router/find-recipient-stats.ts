import type { FindResultResponse } from '@documenso/lib/types/search-params';
import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZFindRecipientStatsRequestSchema,
  ZFindRecipientStatsResponseSchema,
} from './find-recipient-stats.types';

export const findRecipientStatsRoute = adminProcedure
  .input(ZFindRecipientStatsRequestSchema)
  .output(ZFindRecipientStatsResponseSchema)
  .query(async ({ input }) => {
    const { page = 1, perPage = 50, query } = input;

    const where = query
      ? {
          OR: [
            { email: { contains: query, mode: 'insensitive' as const } },
            { name: { contains: query, mode: 'insensitive' as const } },
          ],
          documentDeletedAt: null,
        }
      : { documentDeletedAt: null };

    // Get unique emails with aggregated stats
    const allRecipients = await prisma.recipient.groupBy({
      by: ['email'],
      where,
      _count: {
        id: true,
      },
      _max: {
        signedAt: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const total = allRecipients.length;
    const sliced = allRecipients.slice((page - 1) * perPage, page * perPage);

    if (sliced.length === 0) {
      return {
        data: [],
        count: total,
        currentPage: page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      } satisfies FindResultResponse<[]>;
    }

    const emails = sliced.map((r: { email: string }) => r.email);

    // Get per-status counts for each email using separate counts
    const [completedCounts, pendingCounts, rejectedCounts, latestNames] = await Promise.all([
      prisma.recipient.groupBy({
        by: ['email'],
        where: {
          email: { in: emails },
          documentDeletedAt: null,
          signingStatus: 'SIGNED' as string,
          envelope: {
            status: 'COMPLETED' as string,
          },
        },
        _count: { id: true },
      }),
      prisma.recipient.groupBy({
        by: ['email'],
        where: {
          email: { in: emails },
          documentDeletedAt: null,
          signingStatus: 'NOT_SIGNED' as string,
          envelope: {
            status: { in: ['PENDING'] as string[] },
          },
        },
        _count: { id: true },
      }),
      prisma.recipient.groupBy({
        by: ['email'],
        where: {
          email: { in: emails },
          documentDeletedAt: null,
          signingStatus: 'REJECTED' as string,
        },
        _count: { id: true },
      }),
      // Get the latest name for each email
      prisma.recipient.findMany({
        where: {
          email: { in: emails },
          documentDeletedAt: null,
          name: { not: '' },
        },
        distinct: ['email'],
        select: { email: true, name: true },
        orderBy: { id: 'desc' },
      }),
    ]);

    const completedMap = new Map(completedCounts.map((r: { email: string; _count: { id: number } }) => [r.email, r._count.id]));
    const pendingMap = new Map(pendingCounts.map((r: { email: string; _count: { id: number } }) => [r.email, r._count.id]));
    const rejectedMap = new Map(rejectedCounts.map((r: { email: string; _count: { id: number } }) => [r.email, r._count.id]));
    const nameMap = new Map(latestNames.map((r: { email: string; name: string }) => [r.email, r.name]));

    const data = sliced.map((r: { email: string; _count: { id: number }; _max: { signedAt: Date | null } }) => ({
      email: r.email,
      name: nameMap.get(r.email) ?? '',
      totalDocuments: r._count.id,
      completedDocuments: completedMap.get(r.email) ?? 0,
      pendingDocuments: pendingMap.get(r.email) ?? 0,
      rejectedDocuments: rejectedMap.get(r.email) ?? 0,
      lastActivity: r._max.signedAt ?? null,
    }));

    return {
      data,
      count: total,
      currentPage: page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    } satisfies FindResultResponse<typeof data>;
  });
