import { router } from '../trpc';
import { adminResendEmailRoute } from './admin-resend-email';
import { adminUpdateDocumentMetaRoute } from './admin-update-document-meta';
import { adminSearchRoute } from './admin-search';
import { createAdminOrganisationRoute } from './create-admin-organisation';
import { createStripeCustomerRoute } from './create-stripe-customer';
import { createSubscriptionClaimRoute } from './create-subscription-claim';
import { createUserRoute } from './create-user';
import { deleteDocumentRoute } from './delete-document';
import { deleteOrganisationRoute } from './delete-organisation';
import { deleteAdminOrganisationMemberRoute } from './delete-organisation-member';
import { deleteSubscriptionClaimRoute } from './delete-subscription-claim';
import { deleteAdminTeamMemberRoute } from './delete-team-member';
import { deleteUserRoute } from './delete-user';
import { disableUserRoute } from './disable-user';
import { downloadDocumentAuditLogsRoute } from './download-document-audit-logs';
import { createEmailTransportRoute } from './email-transport/create-email-transport';
import { deleteEmailTransportRoute } from './email-transport/delete-email-transport';
import { findEmailTransportsRoute } from './email-transport/find-email-transports';
import { sendTestEmailTransportRoute } from './email-transport/send-test-email-transport';
import { updateEmailTransportRoute } from './email-transport/update-email-transport';
import { enableUserRoute } from './enable-user';
import { exportActivityLogsRoute } from './export-activity-logs';
import { findApiTokensRoute } from './find-api-tokens';
import { findAdminOrganisationsRoute } from './find-admin-organisations';
import { findAdminWebhooksRoute } from './find-admin-webhooks';
import { findAllActivityLogsRoute } from './find-all-activity-logs';
import { findDocumentAuditLogsRoute } from './find-document-audit-logs';
import { findDocumentJobsRoute } from './find-document-jobs';
import { findDocumentsRoute } from './find-documents';
import { findEmailActivityRoute } from './find-email-activity';
import { findEmailDomainsRoute } from './find-email-domains';
import { findOrganisationStatsRoute } from './find-organisation-stats';
import { findRecipientStatsRoute } from './find-recipient-stats';
import { findSubscriptionClaimsRoute } from './find-subscription-claims';
import { findUnsealedDocumentsRoute } from './find-unsealed-documents';
import { findUserTeamsRoute } from './find-user-teams';
import { findWebhookLogsRoute } from './find-webhook-logs';
import { getAdminOrganisationRoute } from './get-admin-organisation';
import { getAdminTeamRoute } from './get-admin-team';
import { getActivityStatsRoute } from './get-activity-stats';
import { getEmailDomainRoute } from './get-email-domain';
import {
  addHttpBlockListRoute,
  getHttpBlockListRoute,
  getHttpMonitorRoute,
  removeHttpBlockListRoute,
} from './get-http-monitor';
import { getSystemEmailLogsRoute } from './get-system-email-logs';
import { getUserRoute } from './get-user';
import { promoteMemberToOwnerRoute } from './promote-member-to-owner';
import { reregisterEmailDomainRoute } from './reregister-email-domain';
import { resealDocumentRoute } from './reseal-document';
import { resetOrganisationMonthlyStatRoute } from './reset-organisation-monthly-stat';
import { resetTwoFactorRoute } from './reset-two-factor-authentication';
import { resyncLicenseRoute } from './resync-license';
import { swapOrganisationSubscriptionRoute } from './swap-organisation-subscription';
import { syncOrganisationSubscriptionRoute } from './sync-organisation-subscription';
import { updateAdminOrganisationRoute } from './update-admin-organisation';
import { updateOrganisationMemberRoleRoute } from './update-organisation-member-role';
import { updateRecipientRoute } from './update-recipient';
import { updateSiteSettingRoute } from './update-site-setting';
import { updateSubscriptionClaimRoute } from './update-subscription-claim';
import { updateUserRoute } from './update-user';

export const adminRouter = router({
  organisation: {
    find: findAdminOrganisationsRoute,
    get: getAdminOrganisationRoute,
    create: createAdminOrganisationRoute,
    update: updateAdminOrganisationRoute,
    delete: deleteOrganisationRoute,
    subscription: {
      swap: swapOrganisationSubscriptionRoute,
      sync: syncOrganisationSubscriptionRoute,
    },
    stats: {
      find: findOrganisationStatsRoute,
      reset: resetOrganisationMonthlyStatRoute,
    },
  },
  organisationMember: {
    promoteToOwner: promoteMemberToOwnerRoute,
    updateRole: updateOrganisationMemberRoleRoute,
    delete: deleteAdminOrganisationMemberRoute,
  },
  claims: {
    find: findSubscriptionClaimsRoute,
    create: createSubscriptionClaimRoute,
    update: updateSubscriptionClaimRoute,
    delete: deleteSubscriptionClaimRoute,
  },
  stripe: {
    createCustomer: createStripeCustomerRoute,
  },
  license: {
    resync: resyncLicenseRoute,
  },
  user: {
    get: getUserRoute,
    create: createUserRoute,
    update: updateUserRoute,
    delete: deleteUserRoute,
    enable: enableUserRoute,
    disable: disableUserRoute,
    resetTwoFactor: resetTwoFactorRoute,
    findTeams: findUserTeamsRoute,
  },
  httpMonitor: {
    get: getHttpMonitorRoute,
    blockList: getHttpBlockListRoute,
    addBlock: addHttpBlockListRoute,
    removeBlock: removeHttpBlockListRoute,
  },
  systemEmailLogs: {
    get: getSystemEmailLogsRoute,
  },
  document: {
    find: findDocumentsRoute,
    findUnsealed: findUnsealedDocumentsRoute,
    delete: deleteDocumentRoute,
    reseal: resealDocumentRoute,
    findJobs: findDocumentJobsRoute,
    findAuditLogs: findDocumentAuditLogsRoute,
    downloadAuditLogs: downloadDocumentAuditLogsRoute,
    findAllActivityLogs: findAllActivityLogsRoute,
    resendEmail: adminResendEmailRoute,
    updateDocumentMeta: adminUpdateDocumentMetaRoute,
    exportActivityLogs: exportActivityLogsRoute,
    findEmailActivity: findEmailActivityRoute,
    getStats: getActivityStatsRoute,
  },
  recipient: {
    update: updateRecipientRoute,
    findStats: findRecipientStatsRoute,
  },
  webhook: {
    find: findAdminWebhooksRoute,
    findLogs: findWebhookLogsRoute,
  },
  apiToken: {
    find: findApiTokensRoute,
  },
  emailDomain: {
    find: findEmailDomainsRoute,
    get: getEmailDomainRoute,
    reregister: reregisterEmailDomainRoute,
  },
  emailTransport: {
    find: findEmailTransportsRoute,
    create: createEmailTransportRoute,
    update: updateEmailTransportRoute,
    delete: deleteEmailTransportRoute,
    sendTest: sendTestEmailTransportRoute,
  },
  team: {
    get: getAdminTeamRoute,
  },
  teamMember: {
    delete: deleteAdminTeamMemberRoute,
  },
  search: adminSearchRoute,
  updateSiteSetting: updateSiteSettingRoute,
});
