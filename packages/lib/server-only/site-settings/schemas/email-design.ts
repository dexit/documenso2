import { z } from 'zod';

import { ZSiteSettingsBaseSchema } from './_base';

export const SITE_SETTINGS_EMAIL_DESIGN_ID = 'site.email_design';

export const ZSiteSettingsEmailDesignSchema = ZSiteSettingsBaseSchema.extend({
  id: z.literal(SITE_SETTINGS_EMAIL_DESIGN_ID),
  data: z
    .object({
      headerHtml: z.string().optional(),
      footerHtml: z.string().optional(),
      accentColor: z.string().optional(),
    })
    .optional()
    .default({
      headerHtml: '',
      footerHtml: '',
      accentColor: '#A2E771',
    }),
});

export type TSiteSettingsEmailDesignSchema = z.infer<typeof ZSiteSettingsEmailDesignSchema>;
