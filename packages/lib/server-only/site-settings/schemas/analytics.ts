import { z } from 'zod';

import { ZSiteSettingsBaseSchema } from './_base';

export const SITE_SETTINGS_ANALYTICS_ID = 'site.analytics';

export const ZSiteSettingsAnalyticsSchema = ZSiteSettingsBaseSchema.extend({
  id: z.literal(SITE_SETTINGS_ANALYTICS_ID),
  data: z
    .object({
      googleAnalyticsId: z.string().optional(),
      googleTagManagerId: z.string().optional(),
    })
    .optional()
    .default({
      googleAnalyticsId: '',
      googleTagManagerId: '',
    }),
});

export type TSiteSettingsAnalyticsSchema = z.infer<typeof ZSiteSettingsAnalyticsSchema>;
