import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { getSiteSetting } from '@documenso/lib/server-only/site-settings/get-site-setting';
import { SITE_SETTINGS_SUPPORT_ID, type TSiteSettingsSupport } from '@documenso/lib/server-only/site-settings/schemas/support';
import { mailer } from '@documenso/email/mailer';

import { authenticatedProcedure } from '../trpc';
import {
  ZSubmitSupportTicketRequestSchema,
  ZSubmitSupportTicketResponseSchema,
} from './submit-support-ticket.types';

export const submitSupportTicketRoute = authenticatedProcedure
  .input(ZSubmitSupportTicketRequestSchema)
  .output(ZSubmitSupportTicketResponseSchema)
  .mutation(async ({ input, ctx }) => {
    const { orgUrl, values } = input;
    const { user } = ctx;

    const supportSettings = await getSiteSetting<TSiteSettingsSupport>(SITE_SETTINGS_SUPPORT_ID);

    if (!supportSettings?.enabled) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: 'Support form is not enabled',
      });
    }

    const { target, targetValue, title } = supportSettings.data;

    const formattedValues = Object.entries(values)
      .map(([key, value]) => `**${key}**: ${value}`)
      .join('\n');

    const htmlContent = `
      <h3>${title}</h3>
      <p>New support ticket submitted by ${user.name} (${user.email})</p>
      <hr />
      <pre>${formattedValues}</pre>
    `;

    if (target === 'email' && targetValue) {
      await mailer.sendMail({
        to: targetValue,
        subject: `[Support Ticket] ${title} - ${orgUrl}`,
        html: htmlContent,
      });
    }

    if (target === 'webhook' && targetValue) {
      await fetch(targetValue, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'support_ticket_submitted',
          title,
          orgUrl,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          values,
          formattedValues,
        }),
      });
    }

    if (target === 'hubspot' && targetValue) {
      // HubSpot logic could go here, currently using simple post if URL provided
      await fetch(targetValue, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          orgUrl,
          user,
          values,
        })
      });
    }

    return {
      success: true,
    };
  });
