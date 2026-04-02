import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import { parseDocumentAuditLogData } from '@documenso/lib/utils/document-audit-logs';
import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZFindAllActivityLogsRequestSchema,
} from './find-all-activity-logs.types';

export const findAllActivityLogsRoute = adminProcedure
  .input(ZFindAllActivityLogsRequestSchema)
  .query(async ({ input }) => {
    const {
      page = 1,
      perPage = 50,
      type,
      email,
      teamId,
      dateFrom,
      dateTo,
      orderByColumn = 'createdAt',
      orderByDirection = 'desc',
      query,
    } = input;

    const where: Record<string, unknown> = {};

    if (type) where.type = type;

    if (email) where.email = { contains: email, mode: 'insensitive' };

    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { envelope: { title: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const envelopeFilter: Record<string, unknown> = {};
    if (teamId) envelopeFilter.teamId = teamId;
    if (Object.keys(envelopeFilter).length > 0) where.envelope = envelopeFilter;

    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    // Only createdAt supports orderBy on the model level; email/type are strings so also valid
    const validOrderColumns = { createdAt: 'createdAt', type: 'type', email: 'email' } as const;
    const safeOrderColumn = validOrderColumns[orderByColumn] ?? 'createdAt';

    const [data, count] = await Promise.all([
      prisma.documentAuditLog.findMany({
        where,
        skip: Math.max(page - 1, 0) * perPage,
        take: perPage,
        orderBy: { [safeOrderColumn]: orderByDirection },
        include: {
          envelope: {
            select: {
              id: true,
              title: true,
              secondaryId: true,
              userId: true,
              teamId: true,
              team: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.documentAuditLog.count({ where }),
    ]);

    type EnvelopeInfo = { id: string; title: string; secondaryId: string; userId: number; teamId: number | null; team: { id: number; name: string } | null } | null;
    type ParsedEntry = { parsed: ReturnType<typeof parseDocumentAuditLogData>; envelope: EnvelopeInfo };

    const parsedLogs: ParsedEntry[] = (data as Array<Record<string, unknown>>).map((row) => {
      const { envelope, ...log } = row as { envelope: EnvelopeInfo } & Record<string, unknown>;
      return {
        parsed: parseDocumentAuditLogData(log as Parameters<typeof parseDocumentAuditLogData>[0]),
        envelope: envelope ?? null,
      };
    });

    // Batch-load signing tokens for EMAIL_SENT entries on this page
    const recipientIds = parsedLogs
      .filter((l: ParsedEntry) => l.parsed.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT)
      .map((l: ParsedEntry) => {
        try {
          return Number((l.parsed.data as Record<string, unknown>).recipientId);
        } catch {
          return null;
        }
      })
      .filter((id: number | null): id is number => id !== null && !isNaN(id));

    const recipientMap = new Map<number, { id: number; token: string; signingStatus: string }>();

    if (recipientIds.length > 0) {
      const recipients = await prisma.recipient.findMany({
        where: { id: { in: recipientIds } },
        select: { id: true, token: true, signingStatus: true },
      });
      (recipients as Array<{ id: number; token: string; signingStatus: string }>).forEach((r) => recipientMap.set(r.id, r));
    }

    const result = parsedLogs.map(({ parsed, envelope }: ParsedEntry) => {
      let signingLink: string | null = null;

      if (parsed.type === DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT) {
        const recipientId = Number((parsed.data as Record<string, unknown>).recipientId);
        const rec = recipientMap.get(recipientId);
        if (rec && rec.signingStatus === 'NOT_SIGNED') {
          signingLink = `${NEXT_PUBLIC_WEBAPP_URL()}/sign/${rec.token}`;
        }
      }

      return { ...parsed, envelope, signingLink };
    });

    return {
      data: result,
      count: count as number,
      currentPage: Math.max(page, 1),
      perPage,
      totalPages: Math.ceil((count as number) / perPage),
    };
  });
