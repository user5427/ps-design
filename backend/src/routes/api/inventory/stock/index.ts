import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import { getBusinessId } from "../../../../shared/auth-utils";
import { paginationSchema } from "../../../../shared/response-utils";
import { uuid, datetime } from "../../../../shared/zod-schemas";
import { stockChangeTypeEnum } from "../inventory-schemas";

const changeIdParam = z.object({ changeId: uuid() });
const productIdParam = z.object({ productId: uuid() });

const createStockChangeSchema = z.object({
    productId: uuid("Invalid product ID"),
    quantity: z.number(),
    type: stockChangeTypeEnum,
    expirationDate: datetime().optional()
});

const stockQuerySchema = paginationSchema.extend({
    productId: uuid().optional(),
    type: stockChangeTypeEnum.optional(),
});

export default async function stockRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get(
        "/",
        async (request: FastifyRequest, reply: FastifyReply) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const products = await fastify.prisma.product.findMany({
                where: {
                    businessId,
                    deletedAt: null,
                },
                include: {
                    productUnit: true,
                    stockLevel: true,
                },
                orderBy: { name: "asc" },
            });

            const stockLevels = products.map((product) => ({
                productId: product.id,
                productName: product.name,
                productUnit: product.productUnit,
                isDisabled: product.isDisabled,
                totalQuantity: product.stockLevel ? Number(product.stockLevel.quantity) : 0,
            }));

            return reply.send(stockLevels);
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
                where: {
                    id: productId,
                    businessId,
                    deletedAt: null,
                },
                include: {
                    productUnit: true,
                },
            });

            if (!product) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product not found" });
            }

            const stockLevel = await fastify.prisma.stockLevel.findUnique({
                where: { productId },
            });

            return reply.send({
                productId: product.id,
                productName: product.name,
                productUnit: product.productUnit,
                isDisabled: product.isDisabled,
                totalQuantity: stockLevel ? Number(stockLevel.quantity) : 0,
            });
        },
    );

    server.post(
        "/changes",
        {
            schema: {
                body: createStockChangeSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Body: z.infer<typeof createStockChangeSchema>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { productId, quantity, type, expirationDate } = request.body;
            const user = request.authUser!;

            const product = await fastify.prisma.product.findFirst({
                where: { id: productId, businessId },
            });

            if (!product) {
                return reply.code(httpStatus.BAD_REQUEST).send({ message: "Invalid product" });
            }

            const stockChange = await fastify.prisma.$transaction(async (tx) => {
                const change = await tx.stockChange.create({
                    data: {
                        productId,
                        businessId,
                        quantity,
                        type,
                        expirationDate: expirationDate ? new Date(expirationDate) : null,
                        createdByUserId: user.id,
                    },
                    include: {
                        product: {
                            include: {
                                productUnit: true,
                            },
                        },
                        createdBy: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                });

                await tx.stockLevel.upsert({
                    where: { productId },
                    create: {
                        productId,
                        businessId,
                        quantity,
                    },
                    update: {
                        quantity: { increment: quantity },
                    },
                });

                return change;
            });

            return reply.code(httpStatus.CREATED).send(stockChange);
        },
    );

    server.get(
        "/changes",
        {
            schema: {
                querystring: stockQuerySchema,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: z.infer<typeof stockQuerySchema>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { productId } = request.query;

            const changes = await fastify.prisma.stockChange.findMany({
                where: {
                    businessId,
                    deletedAt: null,
                    ...(productId && { productId }),
                },
                include: {
                    product: {
                        include: {
                            productUnit: true,
                        },
                    },
                    createdBy: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            return reply.send(changes);
        },
    );

    server.delete(
        "/changes/:changeId",
        {
            schema: {
                params: changeIdParam,
            },
        },
        async (
            request: FastifyRequest<{
                Params: z.infer<typeof changeIdParam>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { changeId } = request.params;

            const change = await fastify.prisma.stockChange.findFirst({
                where: { id: changeId, businessId, deletedAt: null },
            });

            if (!change) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Stock change not found" });
            }

            await fastify.prisma.$transaction(async (tx) => {
                await tx.stockChange.update({
                    where: { id: changeId },
                    data: { deletedAt: new Date() },
                });

                await tx.stockLevel.update({
                    where: { productId: change.productId },
                    data: {
                        quantity: { decrement: Number(change.quantity) },
                    },
                });
            });

            return reply.code(httpStatus.NO_CONTENT).send();
        },
    );
}
