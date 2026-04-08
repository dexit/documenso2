import { z } from 'zod';

import {
  addToBlockList,
  getBlockList,
  getHttpMonitorStats,
  removeFromBlockList,
} from '@documenso/lib/server-only/http-monitor/store';

import { adminProcedure } from '../trpc';

export const getHttpMonitorRoute = adminProcedure
  .input(
    z.object({
      page: z.number().min(1).default(1),
      perPage: z.number().min(1).max(200).default(50),
      statusCode: z.number().optional(),
      pathFilter: z.string().optional(),
      ipFilter: z.string().optional(),
    }),
  )
  .query(({ input }) => {
    const result = getHttpMonitorStats(input);

    return {
      stats: {
        total4xx: result.stats.total4xx,
        total5xx: result.stats.total5xx,
        uniqueIPs: result.stats.uniqueIPs,
        uniquePaths: result.stats.uniquePaths,
        topPaths: result.stats.topPaths,
        topIPs: result.stats.topIPs,
        topUserAgents: result.stats.topUserAgents,
      },
      entries: result.entries,
      total: result.total,
      currentPage: input.page,
      perPage: input.perPage,
      totalPages: Math.max(1, Math.ceil(result.total / input.perPage)),
    };
  });

export const getHttpBlockListRoute = adminProcedure.query(() => {
  return getBlockList();
});

export const addHttpBlockListRoute = adminProcedure
  .input(
    z.object({
      pattern: z.string().min(1),
      type: z.enum(['exact', 'prefix', 'contains']).default('exact'),
      reason: z.string().optional(),
    }),
  )
  .mutation(({ input }) => {
    addToBlockList(input.pattern, input.type, input.reason);
    return { success: true };
  });

export const removeHttpBlockListRoute = adminProcedure
  .input(z.object({ pattern: z.string().min(1) }))
  .mutation(({ input }) => {
    removeFromBlockList(input.pattern);
    return { success: true };
  });
