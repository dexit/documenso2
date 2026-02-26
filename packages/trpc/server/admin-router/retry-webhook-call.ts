import { Prisma, WebhookCallStatus } from '@prisma/client';
import { adminProcedure } from '../trpc';
import { prisma } from '@documenso/prisma';
import { ZRetryWebhookCallRequestSchema } from './retry-webhook-call.types';

export const retryWebhookCallRoute = adminProcedure
  .input(ZRetryWebhookCallRequestSchema)
  .mutation(async ({ input }) => {
    const { webhookCallId } = input;

    const webhookCall = await prisma.webhookCall.findUniqueOrThrow({
      where: { id: webhookCallId },
      include: { webhook: true },
    });

    const { webhook } = webhookCall;

    const response = await fetch(webhookCall.url, {
      method: 'POST',
      body: JSON.stringify(webhookCall.requestBody),
      headers: {
        'Content-Type': 'application/json',
        'X-Documenso-Secret': webhook.secret ?? '',
      },
    });

    const body = await response.text();
    let responseBody: Prisma.InputJsonValue | Prisma.JsonNullValueInput = Prisma.JsonNull;

    try {
      responseBody = JSON.parse(body);
    } catch (err) {
      responseBody = body;
    }

    return await prisma.webhookCall.update({
      where: { id: webhookCall.id },
      data: {
        status: response.ok ? WebhookCallStatus.SUCCESS : WebhookCallStatus.FAILED,
        responseCode: response.status,
        responseBody,
        responseHeaders: Object.fromEntries(response.headers.entries()),
      },
    });
  });
