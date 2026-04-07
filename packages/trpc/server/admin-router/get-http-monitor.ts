import { z } from 'zod';

import { getHttpMonitorStats } from '@documenso/lib/server-only/http-monitor/store';

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
        total404s: result.stats.total404s,
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
