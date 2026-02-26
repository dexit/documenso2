import { z } from 'zod';

import { ZSiteSettingsBaseSchema } from './_base';

export const SITE_SETTINGS_404_ID = 'site.404';

export const ZSiteSettings404Schema = ZSiteSettingsBaseSchema.extend({
  id: z.literal(SITE_SETTINGS_404_ID),
  data: z
    .object({
      title: z.string(),
      content: z.string(),
    })
    .optional()
    .default({
      title: '404 - Page Not Found',
      content: '',
    }),
});

export type TSiteSettings404Schema = z.infer<typeof ZSiteSettings404Schema>;
