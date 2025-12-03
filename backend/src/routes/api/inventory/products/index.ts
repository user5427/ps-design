import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import { getBusinessId } from "../../../../shared/auth-utils";

const uuidParam = z.uuid();
const productIdParam = z.object({ productId: uuidParam });

const createProductSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    productUnitId: z.uuid("Invalid product unit ID"),
});

const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    productUnitId: z.uuid().optional(),
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

                return reply.code(201).send(product);
            } catch (error: any) {
                if (error.code === "P2002") {
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
            } catch (error: any) {
                if (error.code === "P2002") {
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

            return reply.code(204).send();
        },
    );
}
