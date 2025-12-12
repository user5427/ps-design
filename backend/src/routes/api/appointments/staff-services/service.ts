import type { FastifyInstance } from "fastify";
import type {
  CreateServiceBody,
  UpdateServiceBody,
  StaffServiceResponse,
} from "@ps-design/schemas/appointments/service";
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";

function toStaffServiceResponse(
  staffService: StaffService,
): StaffServiceResponse {
  return {
    id: staffService.id,
    isDisabled: staffService.isDisabled,
    employee: {
      id: staffService.employee.id,
      name: staffService.employee.name,
      email: staffService.employee.email,
    },
    serviceDefinition: {
      id: staffService.serviceDefinition.id,
      name: staffService.serviceDefinition.name,
      description: staffService.serviceDefinition.description,
      price: staffService.serviceDefinition.price,
      baseDuration: staffService.serviceDefinition.baseDuration,
      category: staffService.serviceDefinition.category
        ? {
            id: staffService.serviceDefinition.category.id,
            name: staffService.serviceDefinition.category.name,
          }
        : null,
    },
    createdAt: staffService.createdAt.toISOString(),
    updatedAt: staffService.updatedAt.toISOString(),
  };
}

export async function getAllStaffServices(
  fastify: FastifyInstance,
  businessId: string,
): Promise<StaffServiceResponse[]> {
  const staffServices =
    await fastify.db.staffService.findAllByBusinessId(businessId);
  return staffServices.map(toStaffServiceResponse);
}

export async function createStaffService(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateServiceBody,
): Promise<void> {
  await fastify.db.staffService.create({
    isDisabled: input.isDisabled,
    employeeId: input.employeeId,
    serviceDefinitionId: input.serviceDefinitionId,
    businessId,
  });
}

export async function getStaffServiceById(
  fastify: FastifyInstance,
  businessId: string,
  serviceId: string,
): Promise<StaffServiceResponse> {
  const staffService = await fastify.db.staffService.getById(
    serviceId,
    businessId,
  );
  return toStaffServiceResponse(staffService);
}

export async function updateStaffService(
  fastify: FastifyInstance,
  businessId: string,
  serviceId: string,
  input: UpdateServiceBody,
): Promise<void> {
  await fastify.db.staffService.update(serviceId, businessId, input);
}

export async function bulkDeleteStaffServices(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.staffService.bulkDelete(ids, businessId);
}

export async function getStaffServicesByEmployee(
  fastify: FastifyInstance,
  businessId: string,
  employeeId: string,
): Promise<StaffServiceResponse[]> {
  const staffServices = await fastify.db.staffService.findByEmployeeId(
    employeeId,
    businessId,
  );
  return staffServices.map(toStaffServiceResponse);
}

export async function getStaffServicesByServiceDefinition(
  fastify: FastifyInstance,
  businessId: string,
  serviceDefinitionId: string,
): Promise<StaffServiceResponse[]> {
  const staffServices = await fastify.db.staffService.findByServiceDefinitionId(
    serviceDefinitionId,
    businessId,
  );
  return staffServices.map(toStaffServiceResponse);
}
