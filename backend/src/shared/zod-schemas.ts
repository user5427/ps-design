import z from "zod";

export const uuid = (message?: string) => z.uuid(message);
export const datetime = (message?: string) => z.iso.datetime(message);