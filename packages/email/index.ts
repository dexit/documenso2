import type { SendMailOptions } from 'nodemailer';
import { prisma } from '@documenso/prisma';
import { mailer } from './mailer';
import { env } from '@documenso/lib/utils/env';

export const sendEmail = async (options: SendMailOptions & { userId?: number; teamId?: number }) => {
  const { userId, teamId, ...mailOptions } = options;

  const emailLog = await prisma.emailLog.create({
    data: {
      recipient: Array.isArray(mailOptions.to)
        ? mailOptions.to.map(t => typeof t === 'string' ? t : (t as any).address).join(',')
        : (mailOptions.to?.toString() ?? ''),
      subject: mailOptions.subject ?? '',
      body: mailOptions.html?.toString() || mailOptions.text?.toString() || '',
      from: mailOptions.from?.toString() ?? '',
      status: 'SENT',
      userId: userId ?? null,
      teamId: teamId ?? null,
    },
  });

  const webappUrl = env('NEXT_PUBLIC_WEBAPP_URL') || 'http://localhost:3000';
  const trackingUrl = `${webappUrl}/api/track/email-open/${emailLog.id}`;
  const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none" />`;

  if (mailOptions.html) {
    mailOptions.html = mailOptions.html.toString() + trackingPixel;
  }

  try {
    const info = await mailer.sendMail(mailOptions);
    return info;
  } catch (error) {
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
};

export * from './mailer';
