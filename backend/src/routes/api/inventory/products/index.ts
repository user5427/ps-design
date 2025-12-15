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
import { AuditActionType } from "@/modules/audit";

export default async function productsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope, requireAllScopes, requireAnyScope } =
    createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY),
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
        requireScope(ScopeNames.INVENTORY),
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
        const createProductWrapped = await fastify.audit.generic(
          createProduct,
          AuditActionType.CREATE,
          request,
          reply,
          "Product",
        );

        const product = await createProductWrapped(
          fastify,
          businessId,
          request.body,
        );
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
        requireScope(ScopeNames.INVENTORY),
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
        requireScope(ScopeNames.INVENTORY),
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
        const updateProductWrapped = await fastify.audit.generic(
          updateProduct,
          AuditActionType.UPDATE,
          request,
          reply,
          "Product",
          productId,
        );

        const updated = await updateProductWrapped(
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
        requireScope(ScopeNames.INVENTORY),
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
        const bulkDeleteUnitsWrapped = await fastify.audit.generic(
          bulkDeleteProducts,
          AuditActionType.DELETE,
          request,
          reply,
          "Product",
          request.body.ids,
        );
        await bulkDeleteUnitsWrapped(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
