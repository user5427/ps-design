import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import { getBusinessId } from "../../../../shared/auth-utils";
import { isUniqueConstraintError } from "../../../../shared/prisma-error-utils";
import { uuid } from "../../../../shared/zod-schemas";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} characters`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;

const productIdParam = z.object({ productId: uuid() });

const createProductSchema = z.object({
    name: z
        .string()
        .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
        .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
    description: z.string().optional(),
    productUnitId: uuid("Invalid product unit ID"),
});

const updateProductSchema = z.object({
    name: z
        .string()
        .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
        .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)
        .optional(),
    description: z.string().optional(),
    productUnitId: uuid().optional(),
    isDisabled: z.boolean().optional(),
});

export default async function productsRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get(
        "/",
        async (request: FastifyRequest, reply: FastifyReply) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const products = await fastify.prisma.product.findMany({
                where: { businessId, deletedAt: null },
                include: {
                    productUnit: true,
                    stockLevel: true,
                },
                orderBy: { name: "asc" },
            });

            return reply.send(products);
        },
    );

    server.post(
        "/",
        {
            schema: {
                body: createProductSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Body: z.infer<typeof createProductSchema>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { name, description, productUnitId } = request.body;

            const unit = await fastify.prisma.productUnit.findFirst({
                where: { id: productUnitId, businessId, deletedAt: null },
            });

            if (!unit) {
                return reply.code(httpStatus.BAD_REQUEST).send({ message: "Invalid product unit" });
            }

            try {
                const product = await fastify.prisma.product.create({
                    data: {
                        name,
                        description,
                        productUnitId,
                        businessId,
                    },
                    include: {
                        productUnit: true,
                    },
                });

                return reply.code(httpStatus.CREATED).send(product);
            } catch (error) {
                if (isUniqueConstraintError(error)) {
                    return reply.code(httpStatus.CONFLICT).send({ message: "Product with this name already exists" });
                }
                throw error;
            }
        },
    );

    server.get(
        "/:productId",
        {
            schema: {
                params: productIdParam,
            },
        },
        async (
            request: FastifyRequest<{
                Params: z.infer<typeof productIdParam>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { productId } = request.params;

            const product = await fastify.prisma.product.findFirst({
                where: { id: productId, businessId, deletedAt: null },
                include: {
                    productUnit: true,
                    stockLevel: true,
                },
            });

            if (!product) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product not found" });
            }

            return reply.send(product);
        },
    );

    server.put(
        "/:productId",
        {
            schema: {
                params: productIdParam,
                body: updateProductSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: z.infer<typeof productIdParam>;
                Body: z.infer<typeof updateProductSchema>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { productId } = request.params;
            const { productUnitId, ...rest } = request.body;

            const product = await fastify.prisma.product.findFirst({
                where: { id: productId, businessId, deletedAt: null },
            });

            if (!product) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product not found" });
            }

            if (productUnitId) {
                const unit = await fastify.prisma.productUnit.findFirst({
                    where: { id: productUnitId, businessId, deletedAt: null },
                });

                if (!unit) {
                    return reply.code(httpStatus.BAD_REQUEST).send({ message: "Invalid product unit" });
                }
            }

            try {
                const updated = await fastify.prisma.product.update({
                    where: { id: productId },
                    data: {
                        ...rest,
                        ...(productUnitId && { productUnitId }),
                    },
                    include: {
                        productUnit: true,
                        stockLevel: true,
                    },
                });

                return reply.send(updated);
            } catch (error) {
                if (isUniqueConstraintError(error)) {
                    return reply.code(httpStatus.CONFLICT).send({ message: "Product with this name already exists" });
                }
                throw error;
            }
        },
    );

    server.delete(
        "/:productId",
        {
            schema: {
                params: productIdParam,
            },
        },
        async (
            request: FastifyRequest<{
                Params: z.infer<typeof productIdParam>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { productId } = request.params;

            const product = await fastify.prisma.product.findFirst({
                where: { id: productId, businessId, deletedAt: null },
            });

            if (!product) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product not found" });
            }

            await fastify.prisma.product.update({
                where: { id: productId },
                data: { deletedAt: new Date() },
            });

            return reply.code(httpStatus.NO_CONTENT).send();
        },
    );
}
