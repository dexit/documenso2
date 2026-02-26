import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import { forget } from '@documenso/lib/utils/remember';

export const upsertStringReplacementRoute = adminProcedure
  .input(
    z.object({
      id: z.string().optional(),
      original: z.string().min(1),
      replacement: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    const { id, original, replacement } = input;

    let result;

    if (id) {
      result = await prisma.stringReplacement.update({
        where: { id },
        data: { original, replacement },
      });
    } else {
      result = await prisma.stringReplacement.create({
        data: { original, replacement },
      });
    }

    forget('i18n.allI18nInstances');

    return result;
  });
