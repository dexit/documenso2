import { EnvelopeType, TeamMemberRole } from '@prisma/client';

import { jobs } from '@documenso/lib/jobs/client';
import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { isDocumentCompleted } from '../../utils/document';
import { type EnvelopeIdOptions, mapSecondaryIdToDocumentId } from '../../utils/envelope';
import { isAdmin } from '../../utils/is-admin';
import { unsafeGetEntireEnvelope } from '../admin/get-entire-document';
import { getEnvelopeWhereInput } from '../envelope/get-envelope-by-id';
import { getMemberRoles } from '../team/get-member-roles';

export type ResealDocumentOptions = {
  id: EnvelopeIdOptions;
  userId: number;
  teamId: number;
};

export const resealDocument = async ({ id, userId, teamId }: ResealDocumentOptions) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      roles: true,
    },
  });

  if (!user) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'User not found',
    });
  }

  const isUserGlobalAdmin = isAdmin(user);

  let envelope;

  if (isUserGlobalAdmin) {
    // If the user is a global admin, we bypass the standard visibility checks.
    envelope = await unsafeGetEntireEnvelope({
      id,
      type: EnvelopeType.DOCUMENT,
    });
  } else {
    // Otherwise, we use the standard visibility checks.
    const { envelopeWhereInput } = await getEnvelopeWhereInput({
      id,
      type: EnvelopeType.DOCUMENT,
      userId,
      teamId,
    });

    envelope = await prisma.envelope.findUnique({
      where: envelopeWhereInput,
      select: {
        id: true,
        status: true,
        secondaryId: true,
        teamId: true,
      },
    });
  }

  if (!envelope) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Document not found',
    });
  }

  let isUserManagerOrAbove = false;

  if (!isUserGlobalAdmin && envelope.teamId) {
    try {
      const { teamRole } = await getMemberRoles({
        teamId: envelope.teamId,
        reference: {
          type: 'User',
          id: userId,
        },
      });

      isUserManagerOrAbove =
        teamRole === TeamMemberRole.ADMIN || teamRole === TeamMemberRole.MANAGER;
    } catch (err) {
      // User is not in the team or team doesn't exist.
    }
  }

  if (!isUserGlobalAdmin && !isUserManagerOrAbove) {
    throw new AppError(AppErrorCode.UNAUTHORIZED, {
      message: 'You do not have permission to reseal this document',
    });
  }

  if (!isDocumentCompleted(envelope.status)) {
    throw new AppError(AppErrorCode.INVALID_REQUEST, {
      message: 'Can only reseal completed or rejected documents',
    });
  }

  const isResealing = true;

  await jobs.triggerJob({
    name: 'internal.seal-document',
    payload: {
      documentId: mapSecondaryIdToDocumentId(envelope.secondaryId),
      isResealing,
    },
  });

  return envelope;
};
