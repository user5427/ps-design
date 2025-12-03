import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export function isUniqueConstraintError(error: any): error is PrismaClientKnownRequestError {
    return error instanceof PrismaClientKnownRequestError && error.code === 'P2002';
}