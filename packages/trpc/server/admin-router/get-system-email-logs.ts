import { z } from 'zod';

import { getSystemEmailLogs } from '@documenso/lib/server-only/system-email-log/store';

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
  .query(({ input }) => {
    const result = getSystemEmailLogs(input);

    return {
      entries: result.entries,
      total: result.total,
      currentPage: input.page,
      perPage: input.perPage,
      totalPages: Math.max(1, Math.ceil(result.total / input.perPage)),
    };
  });
