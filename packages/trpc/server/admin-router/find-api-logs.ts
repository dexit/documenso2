import { z } from 'zod';
import { prisma } from '@documenso/prisma';
import { adminProcedure } from '../trpc';

export const findApiLogsRoute = adminProcedure
  .input(
    z.object({
      query: z.string().optional(),
      page: z.number().min(1).default(1),
      perPage: z.number().min(1).max(100).default(20),
    }),
  )
  .query(async ({ input }) => {
    const { query, page, perPage } = input;

    const where = query
      ? {
          OR: [
            { path: { contains: query, mode: 'insensitive' as const } },
            { method: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.apiLog.count({ where }),
    ]);

    return {
      data,
      total,
    };
  });
