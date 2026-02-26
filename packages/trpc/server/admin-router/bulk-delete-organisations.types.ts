import { z } from 'zod';

import type { TRPCMeta } from '../trpc';

export const bulkDeleteOrganisationsMeta: TRPCMeta = {
  accessLevel: 'ADMIN',
};

export const ZBulkDeleteOrganisationsRequestSchema = z.object({
  ids: z.array(z.string()),
});

export const ZBulkDeleteOrganisationsResponseSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number(),
});

export type TBulkDeleteOrganisationsRequest = z.infer<typeof ZBulkDeleteOrganisationsRequestSchema>;
export type TBulkDeleteOrganisationsResponse = z.infer<typeof ZBulkDeleteOrganisationsResponseSchema>;
