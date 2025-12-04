import z from "zod";

export const uuid = (message?: string) => z.uuid(message);
export const datetime = (message?: string) => z.iso.datetime(message);

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});
