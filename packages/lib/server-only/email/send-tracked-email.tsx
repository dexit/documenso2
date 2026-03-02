import { prisma } from '@documenso/prisma';
import { mailer } from '@documenso/email/mailer';
import { renderEmailWithI18N } from '../../utils/render-email-with-i18n';
import { getSiteSettings } from '../site-settings/get-site-settings';
import { SITE_SETTINGS_EMAIL_DESIGN_ID, type TSiteSettingsEmailDesignSchema } from '../site-settings/schemas/email-design';
import type { BrandingSettings } from '@documenso/email/providers/branding';

export type SendTrackedEmailOptions = {
  template: React.ReactElement;
  to: { name: string; address: string } | string;
  subject: string;
  from?: { name: string; address: string } | string;
  replyTo?: { name: string; address: string } | string;
  userId?: number;
  recipientId?: number;
  envelopeId?: string;
  lang?: string;
  branding?: BrandingSettings;
};

export const sendTrackedEmail = async (options: SendTrackedEmailOptions) => {
  const {
    template,
    to,
    subject,
    from,
    replyTo,
    userId,
    recipientId,
    envelopeId,
    lang,
    branding,
  } = options;

  const siteSettings = await getSiteSettings();
  const emailDesign = siteSettings.find((s) => s.id === SITE_SETTINGS_EMAIL_DESIGN_ID) as TSiteSettingsEmailDesignSchema | undefined;
  const globalDesign = emailDesign?.enabled ? emailDesign.data : undefined;

  const emailRecord = await prisma.email.create({
    data: {
      to: typeof to === 'string' ? to : to.address,
      subject,
      body: '',
      recipientId,
      envelopeId,
      userId,
      status: 'PENDING',
    },
  });

  try {
    const [html, text] = await Promise.all([
      renderEmailWithI18N(template, {
        lang,
        branding,
        emailId: emailRecord.id,
        globalDesign,
      }),
      renderEmailWithI18N(template, {
        lang,
        branding,
        plainText: true,
        emailId: emailRecord.id,
        globalDesign,
      }),
    ]);

    await prisma.email.update({
      where: { id: emailRecord.id },
      data: { body: html },
    });

    const info = await mailer.sendMail({
      to,
      from,
      replyTo,
      subject,
      html,
      text,
    });

    await prisma.email.update({
      where: { id: emailRecord.id },
      data: {
        status: 'SENT',
        deliveredAt: new Date(),
      },
    });

    return info;
  } catch (error) {
    await prisma.email.update({
      where: { id: emailRecord.id },
      data: { status: 'FAILED' },
    });
    throw error;
  }
};
