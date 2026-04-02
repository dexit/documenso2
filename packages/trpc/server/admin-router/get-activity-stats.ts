import { DateTime } from 'luxon';

import { DOCUMENT_AUDIT_LOG_TYPE } from '@documenso/lib/types/document-audit-logs';
import { prisma } from '@documenso/prisma';

import { adminProcedure } from '../trpc';
import {
  ZGetActivityStatsResponseSchema,
} from './get-activity-stats.types';

export const getActivityStatsRoute = adminProcedure
  .output(ZGetActivityStatsResponseSchema)
  .query(async () => {
    const now = DateTime.now();
    const todayStart = now.startOf('day').toJSDate();
    const weekStart = now.startOf('week').toJSDate();

    const [
      emailSentTotal,
      emailSentToday,
      emailSentWeek,
      emailOpenedTotal,
      emailOpenedToday,
      emailOpenedWeek,
      signRequestTotal,
      recipientCompleted,
      pendingDocs,
      recipientRejected,
      activitiesToday,
      activitiesWeek,
      activitiesTotal,
    ] = await Promise.all([
      prisma.documentAuditLog.count({ where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT } }),
      prisma.documentAuditLog.count({
        where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT, createdAt: { gte: todayStart } },
      }),
      prisma.documentAuditLog.count({
        where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_SENT, createdAt: { gte: weekStart } },
      }),
      prisma.documentAuditLog.count({ where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED } }),
      prisma.documentAuditLog.count({
        where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED, createdAt: { gte: todayStart } },
      }),
      prisma.documentAuditLog.count({
        where: { type: DOCUMENT_AUDIT_LOG_TYPE.EMAIL_OPENED, createdAt: { gte: weekStart } },
      }),
      prisma.documentAuditLog.count({ where: { type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_SENT } }),
      prisma.documentAuditLog.count({
        where: { type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_COMPLETED },
      }),
      prisma.envelope.count({
        where: { type: 'DOCUMENT' as string, status: 'PENDING' as string },
      }),
      prisma.documentAuditLog.count({
        where: { type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_RECIPIENT_REJECTED },
      }),
      prisma.documentAuditLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.documentAuditLog.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.documentAuditLog.count({}),
    ]);

    const openRate =
      emailSentTotal > 0 ? Math.round((emailOpenedTotal / emailSentTotal) * 100) : 0;

    return {
      emails: {
        sent: { total: emailSentTotal, today: emailSentToday, thisWeek: emailSentWeek },
        opened: { total: emailOpenedTotal, today: emailOpenedToday, thisWeek: emailOpenedWeek },
        openRate,
      },
      signRequests: {
        total: signRequestTotal,
        completed: recipientCompleted,
        pending: pendingDocs,
        rejected: recipientRejected,
      },
      activities: {
        today: activitiesToday,
        thisWeek: activitiesWeek,
        total: activitiesTotal,
      },
    };
  });
