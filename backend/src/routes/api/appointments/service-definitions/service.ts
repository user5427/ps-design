import type { FastifyInstance } from "fastify";
import type {
  CreateServiceDefinitionBody,
  UpdateServiceDefinitionBody,
  ServiceDefinitionResponse,
} from "@ps-design/schemas/appointments/service-definition";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";

function toDefinitionResponse(
  definition: ServiceDefinition,
): ServiceDefinitionResponse {
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    isDisabled: definition.isDisabled,
    category: definition.category
      ? {
          id: definition.category.id,
          name: definition.category.name,
        }
      : null,
    createdAt: definition.createdAt.toISOString(),
    updatedAt: definition.updatedAt.toISOString(),
  };
}

export async function getAllServiceDefinitions(
  fastify: FastifyInstance,
  businessId: string,
  options?: { activeOnly?: boolean },
): Promise<ServiceDefinitionResponse[]> {
  const definitions = await fastify.db.serviceDefinition.findAllByBusinessId(
    businessId,
    options,
  );
  return definitions.map(toDefinitionResponse);
}

export async function createServiceDefinition(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateServiceDefinitionBody,
): Promise<void> {
  await fastify.db.serviceDefinition.create({
    name: input.name,
    description: input.description,
    isDisabled: input.isDisabled,
    categoryId: input.categoryId,
    businessId,
  });
}

export async function getServiceDefinitionById(
  fastify: FastifyInstance,
  businessId: string,
  definitionId: string,
): Promise<ServiceDefinitionResponse> {
  const definition = await fastify.db.serviceDefinition.getById(
    definitionId,
    businessId,
  );
  return toDefinitionResponse(definition);
}

export async function updateServiceDefinition(
  fastify: FastifyInstance,
  businessId: string,
  definitionId: string,
  input: UpdateServiceDefinitionBody,
): Promise<void> {
  await fastify.db.serviceDefinition.update(definitionId, businessId, input);
}

export async function bulkDeleteServiceDefinitions(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.serviceDefinition.bulkDelete(ids, businessId);
}
