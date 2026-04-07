import { DocumentStatus, EnvelopeType, type Prisma } from '@prisma/client';

import { prisma } from '@documenso/prisma';

import type { FindResultResponse } from '../../types/search-params';

export interface AdminFindDocumentsOptions {
  query?: string;
  page?: number;
  perPage?: number;
  status?: 'DRAFT' | 'PENDING' | 'COMPLETED' | 'REJECTED';
  dateFrom?: string;
  dateTo?: string;
  teamId?: number;
  ownerEmail?: string;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderByDirection?: 'asc' | 'desc';
}

export const adminFindDocuments = async ({
  query,
  page = 1,
  perPage = 10,
  status,
  dateFrom,
  dateTo,
  teamId,
  ownerEmail,
  orderBy = 'createdAt',
  orderByDirection = 'desc',
}: AdminFindDocumentsOptions) => {
  let termFilters: Prisma.EnvelopeWhereInput | undefined = !query
    ? undefined
    : {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      };

  if (query && query.startsWith('envelope_')) {
    termFilters = { id: { equals: query } };
  } else if (query && query.startsWith('document_')) {
    termFilters = { secondaryId: { equals: query } };
  } else if (query && !isNaN(parseInt(query))) {
    termFilters = { secondaryId: { equals: `document_${query}` } };
  }

  const where: Prisma.EnvelopeWhereInput = {
    type: EnvelopeType.DOCUMENT,
    ...termFilters,
    ...(status ? { status: DocumentStatus[status] } : {}),
    ...(teamId ? { teamId } : {}),
    ...(ownerEmail ? { user: { email: { contains: ownerEmail, mode: 'insensitive' } } } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
  };

  const safeOrderBy = (['createdAt', 'updatedAt', 'title'] as const).includes(
    orderBy as 'createdAt' | 'updatedAt' | 'title',
  )
    ? orderBy
    : 'createdAt';

  const [data, count] = await Promise.all([
    prisma.envelope.findMany({
      where,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      orderBy: { [safeOrderBy]: orderByDirection },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipients: true,
        team: {
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
        envelopeItems: {
          select: {
            id: true,
            envelopeId: true,
            title: true,
            order: true,
          },
        },
      },
    }),
    prisma.envelope.count({ where }),
  ]);

  return {
    data,
    count,
    currentPage: Math.max(page, 1),
    perPage,
    totalPages: Math.ceil(count / perPage),
  } satisfies FindResultResponse<typeof data>;
};
