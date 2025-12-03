import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";

const uuidParam = z.uuid();

const unitIdParam = z.object({ unitId: uuidParam });
const productIdParam = z.object({ productId: uuidParam });
const changeIdParam = z.object({ changeId: uuidParam });

const createProductUnitSchema = z.object({
    name: z.string().min(1, "Name is required"),
    symbol: z.string().min(1).optional(),
});

const updateProductUnitSchema = z.object({
    name: z.string().min(1).optional(),
    symbol: z.string().min(1).nullable().optional(),
});

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

const stockChangeTypeEnum = z.enum(["SUPPLY", "USAGE", "ADJUSTMENT", "WASTE"]);

const createStockChangeSchema = z.object({
    productId: z.uuid("Invalid product ID"),
    quantity: z.number(),
    type: stockChangeTypeEnum,
    expirationDate: z.iso.datetime().optional().nullable(),
});

const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
});

const stockQuerySchema = paginationSchema.extend({
    productId: z.uuid().optional(),
    type: stockChangeTypeEnum.optional(),
});

function getBusinessId(request: FastifyRequest, reply: FastifyReply): string | null {
    const user = request.authUser;
    if (!user) {
        reply.code(httpStatus.UNAUTHORIZED).send({ message: "Unauthorized" });
        return null;
    }
    if (!user.businessId) {
        reply.code(httpStatus.FORBIDDEN).send({ message: "User is not associated with a business" });
        return null;
    }
    return user.businessId;
}

export default async function inventoryRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get(
        "/units",
        async (request: FastifyRequest, reply: FastifyReply) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const units = await fastify.prisma.productUnit.findMany({
                where: { businessId, deletedAt: null },
                orderBy: { name: "asc" },
            });

            return reply.send(units);
        },
    );

    server.post(
        "/units",
        {
            schema: {
                body: createProductUnitSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Body: z.infer<typeof createProductUnitSchema>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { name, symbol } = request.body;

            try {
                await fastify.prisma.productUnit.create({
                    data: {
                        name,
                        symbol,
                        businessId,
                    },
                });
                return reply.code(httpStatus.CREATED).send();
            } catch (error: any) {
                if (error.code === "P2002") {
                    return reply.code(httpStatus.CONFLICT).send({ message: "Product unit with this name already exists" });
                }
                throw error;
            }
        },
    );

    server.put(
        "/units/:unitId",
        {
            schema: {
                params: unitIdParam,
                body: updateProductUnitSchema,
            },
        },
        async (
            request: FastifyRequest<{
                Params: z.infer<typeof unitIdParam>;
                Body: z.infer<typeof updateProductUnitSchema>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { unitId } = request.params;

            const unit = await fastify.prisma.productUnit.findFirst({
                where: { id: unitId, businessId, deletedAt: null },
            });

            if (!unit) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product unit not found" });
            }

            try {
                await fastify.prisma.productUnit.update({
                    where: { id: unitId },
                    data: request.body,
                });
                return reply.send();
            } catch (error: any) {
                if (error.code === "P2002") {
                    return reply.code(httpStatus.CONFLICT).send({ message: "Product unit with this name already exists" });
                }
                throw error;
            }
        },
    );

    server.delete(
        "/units/:unitId",
        {
            schema: {
                params: unitIdParam,
            },
        },
        async (
            request: FastifyRequest<{
                Params: z.infer<typeof unitIdParam>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { unitId } = request.params;

            const unit = await fastify.prisma.productUnit.findFirst({
                where: { id: unitId, businessId, deletedAt: null },
            });

            if (!unit) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product unit not found" });
            }

            // is unit in use by non-deleted products
            const productsCount = await fastify.prisma.product.count({
                where: { productUnitId: unitId, deletedAt: null },
            });

            if (productsCount > 0) {
                return reply.code(httpStatus.CONFLICT).send({ message: "Cannot delete product unit that is in use by products" });
            }

            // Soft delete
            await fastify.prisma.productUnit.update({
                where: { id: unitId },
                data: { deletedAt: new Date() },
            });

            return reply.code(httpStatus.NO_CONTENT).send();
        },
    );

    server.get(
        "/products",
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
        "/products",
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

            // Verify product unit belongs to this business and is not deleted
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

    // GET /products/:productId - Get single product
    server.get(
        "/products/:productId",
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

    // PUT /products/:productId - Update product
    server.put(
        "/products/:productId",
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

            // If updating product unit, verify it belongs to this business and is not deleted
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

    // DELETE /products/:productId - Delete product
    server.delete(
        "/products/:productId",
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

            // Soft delete product
            await fastify.prisma.product.update({
                where: { id: productId },
                data: { deletedAt: new Date() },
            });

            return reply.code(204).send();
        },
    );

    // ==================== STOCK ====================

    // GET /stock - Get aggregated stock levels
    server.get(
        "/stock",
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

            // Get all products with their stock levels from the StockLevel table
            const products = await fastify.prisma.product.findMany({
                where: {
                    businessId,
                    deletedAt: null,
                    ...(productId && { id: productId }),
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

    // POST /stock - Add stock change
    server.post(
        "/stock",
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

            // Verify product belongs to this business
            const product = await fastify.prisma.product.findFirst({
                where: { id: productId, businessId },
            });

            if (!product) {
                return reply.code(httpStatus.BAD_REQUEST).send({ message: "Invalid product" });
            }

            // Create stock change and update stock level in a transaction
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

                // Update or create stock level
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

            return reply.code(201).send(stockChange);
        },
    );

    // GET /stock-changes - Get stock change history
    server.get(
        "/stock-changes",
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

    // DELETE /stock-changes/:changeId - Delete stock change
    server.delete(
        "/stock-changes/:changeId",
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

            // Soft delete and update stock level in a transaction
            await fastify.prisma.$transaction(async (tx) => {
                await tx.stockChange.update({
                    where: { id: changeId },
                    data: { deletedAt: new Date() },
                });

                // Reverse the quantity change in stock level
                await tx.stockLevel.update({
                    where: { productId: change.productId },
                    data: {
                        quantity: { decrement: Number(change.quantity) },
                    },
                });
            });

            return reply.code(204).send();
        },
    );
}
