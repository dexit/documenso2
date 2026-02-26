import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import { forget } from '@documenso/lib/utils/remember';

export const deleteStringReplacementRoute = adminProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    const result = await prisma.stringReplacement.delete({
      where: { id: input.id },
    });

    forget('i18n.allI18nInstances');

    return result;
  });
