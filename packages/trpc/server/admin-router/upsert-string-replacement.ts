import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import { forget } from '@documenso/lib/utils/remember';
import {
  upsertStringReplacementMeta,
  ZUpsertStringReplacementRequestSchema,
  ZUpsertStringReplacementResponseSchema,
} from './upsert-string-replacement.types';

export const upsertStringReplacementRoute = adminProcedure
  .meta(upsertStringReplacementMeta)
  .input(ZUpsertStringReplacementRequestSchema)
  .output(ZUpsertStringReplacementResponseSchema)
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
