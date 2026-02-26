import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import { mailer } from '@documenso/email/mailer';
import {
  retryEmailMeta,
  ZRetryEmailRequestSchema,
  ZRetryEmailResponseSchema,
} from './retry-email.types';

export const retryEmailRoute = adminProcedure
  .meta(retryEmailMeta)
  .input(ZRetryEmailRequestSchema)
  .output(ZRetryEmailResponseSchema)
  .mutation(async ({ input }) => {
    const email = await prisma.email.findUniqueOrThrow({
      where: { id: input.id },
    });

    await mailer.sendMail({
      to: email.to,
      subject: email.subject,
      html: email.body,
    });

    return { success: true };
  });
