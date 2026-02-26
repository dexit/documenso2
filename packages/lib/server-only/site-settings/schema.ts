import { z } from 'zod';

import { ZSiteSettings404Schema } from './schemas/404';
import { ZSiteSettingsAccessControlSchema } from './schemas/access-control';
import { ZSiteSettingsAnalyticsSchema } from './schemas/analytics';
import { ZSiteSettingsBannerSchema } from './schemas/banner';
import { ZSiteSettingsEmailDesignSchema } from './schemas/email-design';
import { ZSiteSettingsSupportSchema } from './schemas/support';
import { ZSiteSettingsTelemetrySchema } from './schemas/telemetry';

export const ZSiteSettingSchema = z.union([
  ZSiteSettingsBannerSchema,
  ZSiteSettingsTelemetrySchema,
  ZSiteSettings404Schema,
  ZSiteSettingsAnalyticsSchema,
  ZSiteSettingsEmailDesignSchema,
  ZSiteSettingsAccessControlSchema,
  ZSiteSettingsSupportSchema,
]);

export type TSiteSettingSchema = z.infer<typeof ZSiteSettingSchema>;

export const ZSiteSettingsSchema = z.array(ZSiteSettingSchema);

export type TSiteSettingsSchema = z.infer<typeof ZSiteSettingsSchema>;
