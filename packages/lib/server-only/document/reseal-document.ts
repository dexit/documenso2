import { EnvelopeType, TeamMemberRole } from '@prisma/client';

import { jobs } from '@documenso/lib/jobs/client';
import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { isDocumentCompleted } from '../../utils/document';
import { type EnvelopeIdOptions, mapSecondaryIdToDocumentId } from '../../utils/envelope';
import { isAdmin } from '../../utils/is-admin';
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

  const { envelopeWhereInput } = await getEnvelopeWhereInput({
    id,
    type: EnvelopeType.DOCUMENT,
    userId,
    teamId,
  });

  const envelope = await prisma.envelope.findUnique({
    where: envelopeWhereInput,
    select: {
      id: true,
      status: true,
      secondaryId: true,
      teamId: true,
    },
  });

  if (!envelope) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Document not found',
    });
  }

  const isUserAdmin = isAdmin(user);

  let isUserManagerOrAbove = false;

  if (envelope.teamId) {
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

  if (!isUserAdmin && !isUserManagerOrAbove) {
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
