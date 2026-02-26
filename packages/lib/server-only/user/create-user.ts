import { hash } from '@node-rs/bcrypt';
import type { User } from '@prisma/client';

import { prisma } from '@documenso/prisma';

import { SALT_ROUNDS } from '../../constants/auth';
import { AppError, AppErrorCode } from '../../errors/app-error';
import { getSiteSetting } from '../site-settings/get-site-setting';
import { SITE_SETTINGS_ACCESS_CONTROL_ID, type TSiteSettingsAccessControl } from '../site-settings/schemas/access-control';
import { createPersonalOrganisation } from '../organisation/create-organisation';
import { generateDatabaseId } from '../../universal/id';

export interface CreateUserOptions {
  name: string;
  email: string;
  password: string;
  signature?: string | null;
}

export const createUser = async ({ name, email, password, signature }: CreateUserOptions) => {
  const hashedPassword = await hash(password, SALT_ROUNDS);

  const userExists = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (userExists) {
    throw new AppError(AppErrorCode.ALREADY_EXISTS);
  }

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword, // Todo: (RR7) Drop password.
        signature,
      },
    });

    return user;
  });

  // Not used at the moment, uncomment if required.
  await onCreateUserHook(user).catch((err) => {
    // Todo: (RR7) Add logging.
    console.error(err);
  });

  return user;
};

/**
 * Should be run after a user is created, example during email password signup or google sign in.
 *
 * @returns User
 */
export const onCreateUserHook = async (user: User) => {
  const accessControl = await getSiteSetting<TSiteSettingsAccessControl>(
    SITE_SETTINGS_ACCESS_CONTROL_ID,
  );

  if (accessControl?.enabled && accessControl.data.disablePersonalOrganisations) {
    if (accessControl.data.defaultOrganisationId) {
      await prisma.organisationMember.create({
        data: {
          id: generateDatabaseId('member'),
          userId: user.id,
          organisationId: accessControl.data.defaultOrganisationId,
        },
      });
    }

    return user;
  }

  await createPersonalOrganisation({ userId: user.id });

  return user;
};
