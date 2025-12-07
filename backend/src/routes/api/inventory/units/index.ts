import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { createUnit, deleteUnit, getAllUnits, updateUnit } from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateProductUnitBody,
  CreateProductUnitSchema,
  UnitIdParam,
  type UnitIdParams,
  type UpdateProductUnitBody,
  UpdateProductUnitSchema,
} from "@ps-design/schemas/inventory/units";

export default async function unitsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const businessId = getBusinessId(request, reply);
    if (!businessId) return;

    const units = await getAllUnits(fastify, businessId);
    return reply.send(units);
  });

  server.post(
    "/",
    {
      schema: {
        body: CreateProductUnitSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateProductUnitBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const unit = await createUnit(fastify, businessId, request.body);
        return reply.code(httpStatus.CREATED).send(unit);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put(
    "/:unitId",
    {
      schema: {
        params: UnitIdParam,
        body: UpdateProductUnitSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: UnitIdParams;
        Body: UpdateProductUnitBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { unitId } = request.params;

      try {
        const unit = await updateUnit(
          fastify,
          businessId,
          unitId,
          request.body,
        );
        return reply.send(unit);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.delete(
    "/:unitId",
    {
      schema: {
        params: UnitIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: UnitIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { unitId } = request.params;

      try {
        await deleteUnit(fastify, businessId, unitId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
