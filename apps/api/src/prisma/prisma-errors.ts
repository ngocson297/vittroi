import { Prisma } from '../generated/prisma/client';

function hasErrorCode(value: unknown): value is { code: unknown } {
  return typeof value === 'object' && value !== null && 'code' in value;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2002';
  }

  return (
    hasErrorCode(error) && (error.code === 'P2002' || error.code === '23505')
  );
}
