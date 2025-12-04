import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { getBusinessId } from "../../../../shared/auth-utils";
import { handleServiceError } from "../../../../shared/error-handler";
import {
  type CreateProductUnitBody,
  createProductUnitSchema,
  type UnitIdParams,
  type UpdateProductUnitBody,
  unitIdParam,
  updateProductUnitSchema,
} from "./request-types";

export default async function unitsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const businessId = getBusinessId(request, reply);
    if (!businessId) return;

    const units = await fastify.db.productUnit.findAllByBusinessId(businessId);

    return reply.send(units);
  });

  server.post(
    "/",
    {
      schema: {
        body: createProductUnitSchema,
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

      const { name, symbol } = request.body;

      try {
        const unit = await fastify.db.productUnit.create({
          name,
          symbol,
          businessId,
        });
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
        params: unitIdParam,
        body: updateProductUnitSchema,
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
        const unit = await fastify.db.productUnit.update(
          unitId,
          businessId,
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
        params: unitIdParam,
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
        await fastify.db.productUnit.delete(unitId, businessId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
