import type { FindResultResponse } from '@documenso/lib/types/search-params';
import { parseDocumentAuditLogData } from '@documenso/lib/utils/document-audit-logs';
import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZFindAllActivityLogsRequestSchema,
  ZFindAllActivityLogsResponseSchema,
} from './find-all-activity-logs.types';

export const findAllActivityLogsRoute = adminProcedure
  .input(ZFindAllActivityLogsRequestSchema)
  .output(ZFindAllActivityLogsResponseSchema)
  .query(async ({ input }) => {
    const {
      page = 1,
      perPage = 50,
      type,
      envelopeId,
      email,
      orderByColumn = 'createdAt',
      orderByDirection = 'desc',
    } = input;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (envelopeId) {
      where.envelopeId = envelopeId;
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    const [data, count] = await Promise.all([
      prisma.documentAuditLog.findMany({
        where,
        skip: Math.max(page - 1, 0) * perPage,
        take: perPage,
        orderBy: {
          [orderByColumn]: orderByDirection,
        },
        include: {
          envelope: {
            select: {
              id: true,
              title: true,
              secondaryId: true,
              userId: true,
              teamId: true,
            },
          },
        },
      }),
      prisma.documentAuditLog.count({ where }),
    ]);

    const parsedData = data.map(({ envelope, ...auditLog }) => ({
      ...parseDocumentAuditLogData(auditLog),
      envelope: envelope ?? null,
    }));

    return {
      data: parsedData,
      count,
      currentPage: Math.max(page, 1),
      perPage,
      totalPages: Math.ceil(count / perPage),
    } satisfies FindResultResponse<typeof parsedData>;
  });
