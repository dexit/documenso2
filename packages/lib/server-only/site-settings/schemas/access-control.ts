import { z } from 'zod';

import { ZSiteSettingsBaseSchema } from './_base';

export const SITE_SETTINGS_ACCESS_CONTROL_ID = 'access-control' as const;

export const ZSiteSettingsAccessControlSchema = ZSiteSettingsBaseSchema.extend({
  id: z.literal('access-control'),
  data: z.object({
    disablePersonalOrganisations: z.boolean().default(false),
    defaultOrganisationId: z.string().optional(),
  }),
});

export type TSiteSettingsAccessControl = z.infer<typeof ZSiteSettingsAccessControlSchema>;
