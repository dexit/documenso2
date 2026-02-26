import { z } from 'zod';

import { ZSiteSettingsBaseSchema } from './_base';

export const SITE_SETTINGS_SUPPORT_ID = 'support' as const;

export const ZSupportFormFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['text', 'textarea', 'email', 'select']),
  required: z.boolean().default(false),
  options: z.string().optional(), // For select type
});

export const ZSupportFormSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  title: z.string().default('Contact Support'),
  description: z.string().default('How can we help you?'),
  fields: z.array(ZSupportFormFieldSchema).default([]),
  target: z.enum(['email', 'webhook', 'hubspot']).default('email'),
  targetValue: z.string().optional(), // email address or webhook URL
});

export const ZSiteSettingsSupportSchema = ZSiteSettingsBaseSchema.extend({
  id: z.literal(SITE_SETTINGS_SUPPORT_ID),
  data: ZSupportFormSettingsSchema,
});

export type TSiteSettingsSupport = z.infer<typeof ZSiteSettingsSupportSchema>;
