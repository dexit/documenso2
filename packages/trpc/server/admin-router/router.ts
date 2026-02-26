import { router } from '../trpc';
import { bulkDeleteOrganisationsRoute } from './bulk-delete-organisations';
import { createAdminOrganisationRoute } from './create-admin-organisation';
import { createStripeCustomerRoute } from './create-stripe-customer';
import { createSubscriptionClaimRoute } from './create-subscription-claim';
import { deleteDocumentRoute } from './delete-document';
import { deleteSubscriptionClaimRoute } from './delete-subscription-claim';
import { deleteUserRoute } from './delete-user';
import { disableUserRoute } from './disable-user';
import { enableUserRoute } from './enable-user';
import { findAdminOrganisationsRoute } from './find-admin-organisations';
import { findAllJobsRoute } from './find-all-jobs';
import { findAllWebhookCallsRoute } from './find-all-webhook-calls';
import { findDocumentAuditLogsRoute } from './find-document-audit-logs';
import { findDocumentJobsRoute } from './find-document-jobs';
import { bulkDeleteUsersRoute } from './bulk-delete-users';
import { findDocumentsRoute } from './find-documents';
import { findEmailsRoute } from './find-emails';
import { findStringReplacementsRoute } from './find-string-replacements';
import { findSubscriptionClaimsRoute } from './find-subscription-claims';
import { findUserTeamsRoute } from './find-user-teams';
import { getAdminOrganisationRoute } from './get-admin-organisation';
import { getUserRoute } from './get-user';
import { promoteMemberToOwnerRoute } from './promote-member-to-owner';
import { resealDocumentRoute } from './reseal-document';
import { retryEmailRoute } from './retry-email';
import { retryJobRoute } from './retry-job';
import { retryWebhookCallRoute } from './retry-webhook-call';
import { resetTwoFactorRoute } from './reset-two-factor-authentication';
import { resyncLicenseRoute } from './resync-license';
import { updateAdminOrganisationRoute } from './update-admin-organisation';
import { updateOrganisationMemberRoleRoute } from './update-organisation-member-role';
import { updateRecipientRoute } from './update-recipient';
import { updateSiteSettingRoute } from './update-site-setting';
import { updateSubscriptionClaimRoute } from './update-subscription-claim';
import { updateUserRoute } from './update-user';
import { upsertStringReplacementRoute } from './upsert-string-replacement';

import { bulkDeleteDocumentsRoute } from './bulk-delete-documents';

import { bulkDeleteWebhookCallsRoute } from './bulk-delete-webhook-calls';

import { bulkDeleteEmailsRoute } from './bulk-delete-emails';

import { bulkDeleteJobsRoute } from './bulk-delete-jobs';

import { bulkDeleteClaimsRoute } from './bulk-delete-claims';

import { bulkDeleteStringReplacementsRoute } from './bulk-delete-string-replacements';

export const adminRouter = router({
  organisation: {
    find: findAdminOrganisationsRoute,
    get: getAdminOrganisationRoute,
    create: createAdminOrganisationRoute,
    update: updateAdminOrganisationRoute,
    bulkDelete: bulkDeleteOrganisationsRoute,
  },
  organisationMember: {
    promoteToOwner: promoteMemberToOwnerRoute,
    updateRole: updateOrganisationMemberRoleRoute,
  },
  claims: {
    find: findSubscriptionClaimsRoute,
    create: createSubscriptionClaimRoute,
    update: updateSubscriptionClaimRoute,
    delete: deleteSubscriptionClaimRoute,
    bulkDelete: bulkDeleteClaimsRoute,
  },
  stripe: {
    createCustomer: createStripeCustomerRoute,
  },
  license: {
    resync: resyncLicenseRoute,
  },
  user: {
    get: getUserRoute,
    update: updateUserRoute,
    delete: deleteUserRoute,
    bulkDelete: bulkDeleteUsersRoute,
    enable: enableUserRoute,
    disable: disableUserRoute,
    resetTwoFactor: resetTwoFactorRoute,
    findTeams: findUserTeamsRoute,
  },
  document: {
    find: findDocumentsRoute,
    delete: deleteDocumentRoute,
    bulkDelete: bulkDeleteDocumentsRoute,
    reseal: resealDocumentRoute,
    findJobs: findDocumentJobsRoute,
    findAuditLogs: findDocumentAuditLogsRoute,
  },
  recipient: {
    update: updateRecipientRoute,
  },
  updateSiteSetting: updateSiteSettingRoute,
  email: {
    find: findEmailsRoute,
    retry: retryEmailRoute,
    bulkDelete: bulkDeleteEmailsRoute,
  },
  webhook: {
    findAllCalls: findAllWebhookCallsRoute,
    retryCall: retryWebhookCallRoute,
    bulkDeleteCalls: bulkDeleteWebhookCallsRoute,
  },
  job: {
    findAll: findAllJobsRoute,
    retry: retryJobRoute,
    bulkDelete: bulkDeleteJobsRoute,
  },
  stringReplacement: {
    find: findStringReplacementsRoute,
    upsert: upsertStringReplacementRoute,
    bulkDelete: bulkDeleteStringReplacementsRoute,
  },
});
