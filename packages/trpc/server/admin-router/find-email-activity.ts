import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import type { FindResultResponse } from '@documenso/lib/types/search-params';
import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZFindEmailActivityRequestSchema,
  ZFindEmailActivityResponseSchema,
} from './find-email-activity.types';

export const findEmailActivityRoute = adminProcedure
  .input(ZFindEmailActivityRequestSchema)
  .output(ZFindEmailActivityResponseSchema)
  .query(async ({ input }) => {
    const { page = 1, perPage = 50, emailType, teamId, dateFrom, dateTo, orderByDirection = 'desc', query } = input;

    const where: Record<string, unknown> = {
      type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT,
    };

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

    // Optionally filter by email type via JSON data
    const [emailSentLogs, count, totalSentCount, totalOpenedCount] = await Promise.all([
      prisma.documentAuditLog.findMany({
        where,
        skip: Math.max(page - 1, 0) * perPage,
        take: perPage,
        orderBy: { createdAt: orderByDirection },
        include: {
          envelope: {
            select: {
              id: true,
              title: true,
              secondaryId: true,
              team: { select: { name: true } },
              user: { select: { name: true, email: true } },
            },
          },
        },
      }),
      prisma.documentAuditLog.count({ where }),
      prisma.documentAuditLog.count({ where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT } }),
      prisma.documentAuditLog.count({ where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED } }),
    ]);

    type LogRow = { id: string; envelopeId: string; createdAt: Date; data: unknown; email: string | null; name: string | null; ipAddress: string | null; userAgent: string | null; type: string; envelope: { id: string; title: string; secondaryId: string; team: { name: string } | null; user: { name: string | null; email: string } | null } | null };
    // Get open counts per (envelopeId, recipientId) for this page
    const envelopeIds = [...new Set((emailSentLogs as LogRow[]).map((l) => l.envelopeId))];

    type OpenCountRow = { envelopeid: string; recipientid: string; opencount: string; lastopenat: Date | null };

    const openCountRows = envelopeIds.length
      ? await prisma.$queryRaw<OpenCountRow[]>`
          SELECT
            "envelopeId" AS envelopeid,
            data->>'recipientId' AS recipientid,
            COUNT(*) AS opencount,
            MAX("createdAt") AS lastopenat
          FROM "DocumentAuditLog"
          WHERE "type" = 'EMAIL_OPENED'
            AND "envelopeId" = ANY(${envelopeIds})
          GROUP BY "envelopeId", data->>'recipientId'
        `
      : [];

    // Map for quick lookup: `${envelopeId}:${recipientId}` → counts
    const openMap = new Map<string, { count: number; lastAt: Date | null }>(
      openCountRows.map((r: OpenCountRow) => [
        `${r.envelopeid}:${r.recipientid}`,
        { count: Number(r.opencount), lastAt: r.lastopenat ?? null },
      ]),
    );

    // Get signing tokens for non-signed recipients in this page
    const recipientIds = (emailSentLogs as LogRow[])
      .map((l) => {
        try { return Number((l.data as Record<string, unknown>).recipientId); } catch { return null; }
      })
      .filter((id: number | null): id is number => id !== null && !isNaN(id));

    type RecipientInfo = { id: number; token: string; signingStatus: string };
    const recipients: RecipientInfo[] =
      recipientIds.length > 0
        ? (await prisma.recipient.findMany({
            where: { id: { in: recipientIds } },
            select: { id: true, token: true, signingStatus: true },
          })) as RecipientInfo[]
        : [];

    const recipientMap = new Map(recipients.map((r: RecipientInfo) => [r.id, r]));

    const data = (emailSentLogs as LogRow[]).map((log) => {
      const d = log.data as Record<string, unknown>;
      const recipientId = Number(d.recipientId ?? 0);
      const openKey = `${log.envelopeId}:${recipientId}`;
      const opens = openMap.get(openKey) ?? { count: 0, lastAt: null };

      const recipient = recipientMap.get(recipientId);
      const signingLink =
        recipient && recipient.signingStatus === 'NOT_SIGNED'
          ? `${NEXT_PUBLIC_WEBAPP_URL()}/sign/${recipient.token}`
          : null;

      return {
        id: log.id,
        envelopeId: log.envelopeId,
        sentAt: log.createdAt,
        recipientEmail: String(d.recipientEmail ?? log.email ?? ''),
        recipientName: String(d.recipientName ?? log.name ?? ''),
        recipientId,
        recipientRole: String(d.recipientRole ?? ''),
        emailType: String(d.emailType ?? ''),
        isResending: Boolean(d.isResending),
        openCount: opens.count,
        lastOpenedAt: opens.lastAt,
        documentTitle: log.envelope?.title ?? '',
        documentId: log.envelope?.id ?? '',
        teamName: log.envelope?.team?.name ?? null,
        signingLink,
        senderName: log.envelope?.user?.name ?? null,
        senderEmail: log.envelope?.user?.email ?? null,
      };
    });

    const openRate =
      totalSentCount > 0 ? Math.round((totalOpenedCount / totalSentCount) * 100) : 0;

    return {
      data,
      count,
      currentPage: Math.max(page, 1),
      perPage,
      totalPages: Math.ceil(count / perPage),
      stats: {
        totalSent: totalSentCount,
        totalOpened: totalOpenedCount,
        openRate,
      },
    } satisfies FindResultResponse<typeof data> & { stats: { totalSent: number; totalOpened: number; openRate: number } };
  });
