import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteProducts,
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateProductBody,
  CreateProductSchema,
  ProductIdParam,
  type ProductIdParams,
  type UpdateProductBody,
  UpdateProductSchema,
} from "@ps-design/schemas/inventory/products";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { bulkDeleteUnits } from "../units/service";

export default async function productsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope, requireAllScopes, requireAnyScope } =
    createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const products = await getAllProducts(fastify, businessId);
      return reply.send(products);
    },
  );

  server.post<{ Body: CreateProductBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        body: CreateProductSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateProductBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const product = await createProduct(fastify, businessId, request.body);
        return reply.code(httpStatus.CREATED).send(product);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: ProductIdParams }>(
    "/:productId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
      schema: {
        params: ProductIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ProductIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.params;

      try {
        const product = await getProductById(fastify, businessId, productId);
        return reply.send(product);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: ProductIdParams; Body: UpdateProductBody }>(
    "/:productId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        params: ProductIdParam,
        body: UpdateProductSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ProductIdParams;
        Body: UpdateProductBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.params;

      try {
        const updated = await updateProduct(
          fastify,
          businessId,
          productId,
          request.body,
        );
        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: BulkDeleteBody }>(
    "/bulk-delete",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_DELETE),
      ],
      schema: {
        body: BulkDeleteSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: BulkDeleteBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        await bulkDeleteUnits(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
