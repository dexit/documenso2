import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZExportActivityLogsRequestSchema,
  ZExportActivityLogsResponseSchema,
} from './export-activity-logs.types';

const escapeCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

const toCsvRow = (cells: string[]) => cells.map(escapeCsvCell).join(',');

export const exportActivityLogsRoute = adminProcedure
  .input(ZExportActivityLogsRequestSchema)
  .output(ZExportActivityLogsResponseSchema)
  .mutation(async ({ input }) => {
    const { type, email, teamId, dateFrom, dateTo } = input;

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (teamId) where.envelope = { teamId };

    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const logs = await prisma.documentAuditLog.findMany({
      where,
      take: 10_000,
      orderBy: { createdAt: 'desc' },
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
    });

    const headers = [
      'ID',
      'Type',
      'Timestamp',
      'Actor Name',
      'Actor Email',
      'Document Title',
      'Document ID',
      'Team',
      'Document Owner',
      'IP Address',
      'User Agent',
    ];

    type LogRow = { id: string; type: string; createdAt: Date; name: string | null; email: string | null; ipAddress: string | null; userAgent: string | null; envelope: { title: string; secondaryId: string; team: { name: string } | null; user: { name: string | null; email: string } | null } | null };
    const rows = (logs as LogRow[]).map((log) =>
      toCsvRow([
        log.id,
        log.type,
        DateTime.fromJSDate(log.createdAt).toISO() ?? '',
        log.name ?? '',
        log.email ?? '',
        log.envelope?.title ?? '',
        log.envelope?.secondaryId ?? '',
        log.envelope?.team?.name ?? '',
        log.envelope?.user?.name ?? log.envelope?.user?.email ?? '',
        log.ipAddress ?? '',
        log.userAgent ?? '',
      ]),
    );

    const csv = [toCsvRow(headers), ...rows].join('\n');

    const filename = `activity-logs-${DateTime.now().toFormat('yyyy-MM-dd')}.csv`;

    return { csv, filename, count: logs.length };
  });
