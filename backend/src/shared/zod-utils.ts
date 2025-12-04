import z from "zod";

// Common Zod utility functions for reusable primitives

export const uuid = (message?: string) => z.uuid(message);
export const datetime = (message?: string) => z.iso.datetime(message);
