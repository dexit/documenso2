import { z } from 'zod';

import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';

export const getSystemEmailLogsRoute = adminProcedure
  .input(
    z.object({
      page: z.number().min(1).default(1),
      perPage: z.number().min(1).max(200).default(50),
      type: z
        .enum(['signup_confirmation', 'password_reset', 'password_changed', 'other'])
        .optional(),
      emailFilter: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    const { page, perPage, type, emailFilter } = input;

    const where = {
      ...(type ? { type } : {}),
      ...(emailFilter
        ? { recipientEmail: { contains: emailFilter, mode: 'insensitive' as const } }
        : {}),
    };

    const [entries, total] = await Promise.all([
      prisma.systemEmailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.systemEmailLog.count({ where }),
    ]);

    return {
      entries,
      total,
      currentPage: page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  });
