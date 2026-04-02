import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZFindApiTokensRequestSchema,
  ZFindApiTokensResponseSchema,
} from './find-api-tokens.types';

export const findApiTokensRoute = adminProcedure
  .input(ZFindApiTokensRequestSchema)
  .output(ZFindApiTokensResponseSchema)
  .query(async ({ input }) => {
    const { page = 1, perPage = 50, teamId, query, orderByDirection = 'desc' } = input;

    const where: Record<string, unknown> = {};
    if (teamId) where.teamId = teamId;
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { user: { email: { contains: query, mode: 'insensitive' } } },
        { team: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const [data, count] = await Promise.all([
      prisma.apiToken.findMany({
        where,
        skip: Math.max(page - 1, 0) * perPage,
        take: perPage,
        orderBy: { createdAt: orderByDirection },
        select: {
          id: true,
          name: true,
          algorithm: true,
          expires: true,
          createdAt: true,
          teamId: true,
          team: { select: { name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.apiToken.count({ where }),
    ]);

    type ApiTokenRow = {
      id: number;
      name: string;
      algorithm: string;
      expires: Date | null;
      createdAt: Date;
      teamId: number;
      team: { name: string } | null;
      user: { id: number; name: string | null; email: string } | null;
    };

    const result = (data as ApiTokenRow[]).map((token) => ({
      id: token.id,
      name: token.name,
      algorithm: token.algorithm as string,
      expires: token.expires,
      createdAt: token.createdAt,
      teamId: token.teamId,
      teamName: token.team?.name ?? null,
      userName: token.user?.name ?? null,
      userEmail: token.user?.email ?? null,
      userId: token.user?.id ?? null,
      isExpired: token.expires ? token.expires < new Date() : false,
    }));

    return {
      data: result,
      count: count as number,
      currentPage: Math.max(page, 1),
      perPage,
      totalPages: Math.ceil((count as number) / perPage),
    };
  });
