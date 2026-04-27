import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DocumentStatus, RecipientRole, TeamMemberRole } from '@prisma/client';
import {
  CheckCircle,
  Copy,
  Download,
  Edit,
  EyeIcon,
  FolderInput,
  Loader,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Share,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router';

import { useSession } from '@documenso/lib/client-only/providers/session';
import type { TDocumentMany as TDocumentRow } from '@documenso/lib/types/document';
import { isDocumentCompleted } from '@documenso/lib/utils/document';
import { mapSecondaryIdToDocumentId } from '@documenso/lib/utils/envelope';
import { isAdmin } from '@documenso/lib/utils/is-admin';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { DocumentShareButton } from '@documenso/ui/components/document/document-share-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';

import { DocumentDeleteDialog } from '~/components/dialogs/document-delete-dialog';
import { DocumentDuplicateDialog } from '~/components/dialogs/document-duplicate-dialog';
import { DocumentResealDialog } from '~/components/dialogs/document-reseal-dialog';
import { DocumentResendDialog } from '~/components/dialogs/document-resend-dialog';
import { DocumentRecipientLinkCopyDialog } from '~/components/general/document/document-recipient-link-copy-dialog';
import { useCurrentTeam } from '~/providers/team';

import { EnvelopeDownloadDialog } from '../dialogs/envelope-download-dialog';

export type DocumentsTableActionDropdownProps = {
  row: TDocumentRow;
  onMoveDocument?: () => void;
};

export const DocumentsTableActionDropdown = ({
  row,
  onMoveDocument,
}: DocumentsTableActionDropdownProps) => {
  const { user } = useSession();
  const team = useCurrentTeam();

  const { _ } = useLingui();

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [isResealDialogOpen, setResealDialogOpen] = useState(false);

  const recipient = row.recipients.find((recipient) => recipient.email === user.email);

  const isOwner = row.user.id === user.id;
  // const isRecipient = !!recipient;
  const isDraft = row.status === DocumentStatus.DRAFT;
  const isPending = row.status === DocumentStatus.PENDING;
  const isComplete = isDocumentCompleted(row.status);
  // const isSigned = recipient?.signingStatus === SigningStatus.SIGNED;
  const isCurrentTeamDocument = team && row.team?.url === team.url;
  const canManageDocument = Boolean(isOwner || isCurrentTeamDocument);

  const documentsPath = formatDocumentsPath(team.url);
  const formatPath = `${documentsPath}/${row.envelopeId}/edit`;

  const nonSignedRecipients = row.recipients.filter((item) => item.signingStatus !== 'SIGNED');

  const isUserAdmin = isAdmin(user);
  const isUserManagerOrAbove =
    isCurrentTeamDocument &&
    (team.currentTeamRole === TeamMemberRole.ADMIN || team.currentTeamRole === TeamMemberRole.MANAGER);

  const canReseal = isUserAdmin || isUserManagerOrAbove;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-testid="document-table-action-btn">
        <MoreHorizontal className="text-muted-foreground h-5 w-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-52" align="start" forceMount>
        <DropdownMenuLabel>
          <Trans>Action</Trans>
        </DropdownMenuLabel>

        {!isDraft &&
          recipient &&
          recipient?.role !== RecipientRole.CC &&
          recipient?.role !== RecipientRole.ASSISTANT && (
            <DropdownMenuItem disabled={!recipient || isComplete} asChild>
              <Link to={`/sign/${recipient?.token}`}>
                {recipient?.role === RecipientRole.VIEWER && (
                  <>
                    <EyeIcon className="mr-2 h-4 w-4" />
                    <Trans>View</Trans>
                  </>
                )}

                {recipient?.role === RecipientRole.SIGNER && (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    <Trans>Sign</Trans>
                  </>
                )}

                {recipient?.role === RecipientRole.APPROVER && (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <Trans>Approve</Trans>
                  </>
                )}
              </Link>
            </DropdownMenuItem>
          )}

        <DropdownMenuItem disabled={!canManageDocument || isComplete} asChild>
          <Link to={formatPath}>
            <Edit className="mr-2 h-4 w-4" />
            <Trans>Edit</Trans>
          </Link>
        </DropdownMenuItem>

        <EnvelopeDownloadDialog
          envelopeId={row.envelopeId}
          envelopeStatus={row.status}
          token={recipient?.token}
          trigger={
            <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
              <div>
                <Download className="mr-2 h-4 w-4" />
                <Trans>Download</Trans>
              </div>
            </DropdownMenuItem>
          }
        />

        <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
          <Copy className="mr-2 h-4 w-4" />
          <Trans>Duplicate</Trans>
        </DropdownMenuItem>

        {onMoveDocument && canManageDocument && (
          <DropdownMenuItem onClick={onMoveDocument} onSelect={(e) => e.preventDefault()}>
            <FolderInput className="mr-2 h-4 w-4" />
            <Trans>Move to Folder</Trans>
          </DropdownMenuItem>
        )}

        {isComplete && canReseal && (
          <DropdownMenuItem onClick={() => setResealDialogOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <Trans>Reseal</Trans>
          </DropdownMenuItem>
        )}

        {/* No point displaying this if there's no functionality. */}
        {/* <DropdownMenuItem disabled>
          <XCircle className="mr-2 h-4 w-4" />
          Void
        </DropdownMenuItem> */}

        <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {canManageDocument ? _(msg`Delete`) : _(msg`Hide`)}
        </DropdownMenuItem>

        <DropdownMenuLabel>
          <Trans>Share</Trans>
        </DropdownMenuLabel>

        {canManageDocument && (
          <DocumentRecipientLinkCopyDialog
            recipients={row.recipients}
            trigger={
              <DropdownMenuItem disabled={!isPending} asChild onSelect={(e) => e.preventDefault()}>
                <div>
                  <Copy className="mr-2 h-4 w-4" />
                  <Trans>Signing Links</Trans>
                </div>
              </DropdownMenuItem>
            }
          />
        )}

        <DocumentResendDialog document={row} recipients={nonSignedRecipients} />

        <DocumentShareButton
          documentId={row.id}
          token={isOwner ? undefined : recipient?.token}
          trigger={({ loading, disabled }) => (
            <DropdownMenuItem disabled={disabled || isDraft} onSelect={(e) => e.preventDefault()}>
              <div className="flex items-center">
                {loading ? <Loader className="mr-2 h-4 w-4" /> : <Share className="mr-2 h-4 w-4" />}
                <Trans>Share Signing Card</Trans>
              </div>
            </DropdownMenuItem>
          )}
        />
      </DropdownMenuContent>

      <DocumentDeleteDialog
        id={row.id}
        status={row.status}
        documentTitle={row.title}
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        canManageDocument={canManageDocument}
      />

      <DocumentDuplicateDialog
        id={row.envelopeId}
        token={recipient?.token}
        open={isDuplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
      />

      <DocumentResealDialog
        documentId={mapSecondaryIdToDocumentId(row.secondaryId)}
        documentTitle={row.title}
        open={isResealDialogOpen}
        onOpenChange={setResealDialogOpen}
      />
    </DropdownMenu>
  );
};
