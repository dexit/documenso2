import { z } from 'zod';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import { mailer } from '@documenso/email/mailer';

export const retryEmailRoute = adminProcedure
  .input(z.object({ id: z.string() }))
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
