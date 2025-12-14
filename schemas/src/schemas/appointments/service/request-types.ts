import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

export const ServiceIdParam = z.object({ serviceId: uuid() });

export const CreateServiceSchema = z.object({
  employeeId: uuid(),
  serviceDefinitionId: uuid(),
  isDisabled: z.boolean().default(false),
});

export const UpdateServiceSchema = z.object({
  isDisabled: z.boolean(),
});

export type CreateServiceBody = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceBody = z.infer<typeof UpdateServiceSchema>;
export type ServiceIdParams = z.infer<typeof ServiceIdParam>;
