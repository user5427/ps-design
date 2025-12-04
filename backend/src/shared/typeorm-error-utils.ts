import { QueryFailedError } from "typeorm";

export function isUniqueConstraintError(error: unknown): boolean {
    if (error instanceof QueryFailedError) {
        // PostgreSQL unique violation error code
        const driverError = error.driverError as { code?: string };
        return driverError?.code === "23505";
    }
    return false;
}
