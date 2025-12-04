import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import { getBusinessId } from "../../../../shared/auth-utils";
import { paginationSchema } from "../../../../shared/request-types";
import { uuid, datetime } from "../../../../shared/zod-utils";
import { stockChangeTypeEnum } from "../inventory-schemas";
import { StockChange } from "../../../../modules/stock-change/stock-change.entity";
import { StockLevel } from "../../../../modules/stock-level/stock-level.entity";

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

            const products = await fastify.db.product.findAllByBusinessId(businessId);

            const stockLevels = products.map((product) => ({
                productId: product.id,
                productName: product.name,
                productUnit: product.productUnit,
                isDisabled: product.isDisabled,
                totalQuantity: product.stockLevel?.quantity ?? 0,
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

            const product = await fastify.db.product.findByIdAndBusinessId(productId, businessId);

            if (!product) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product not found" });
            }

            const stockLevel = await fastify.db.stockLevel.findByProductId(productId);

            return reply.send({
                productId: product.id,
                productName: product.name,
                productUnit: product.productUnit,
                isDisabled: product.isDisabled,
                totalQuantity: stockLevel?.quantity ?? 0,
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

            const product = await fastify.db.product.findByIdSimple(productId, businessId);

            if (!product) {
                return reply.code(httpStatus.BAD_REQUEST).send({ message: "Invalid product" });
            }

            const stockChange = await fastify.db.dataSource.transaction(async (manager) => {
                const stockChangeRepo = manager.getRepository(
                    StockChange
                );
                const stockLevelRepo = manager.getRepository(
                    StockLevel
                );

                const change = stockChangeRepo.create({
                    productId,
                    businessId,
                    quantity,
                    type,
                    expirationDate: expirationDate ? new Date(expirationDate) : null,
                    createdByUserId: user.id,
                });
                const savedChange = await stockChangeRepo.save(change);

                const existingLevel = await stockLevelRepo.findOne({ where: { productId } });
                if (existingLevel) {
                    const newQuantity = existingLevel.quantity + quantity;
                    await stockLevelRepo.update(existingLevel.id, { quantity: newQuantity });
                } else {
                    const newLevel = stockLevelRepo.create({
                        productId,
                        businessId,
                        quantity,
                    });
                    await stockLevelRepo.save(newLevel);
                }

                return stockChangeRepo.findOne({
                    where: { id: savedChange.id },
                    relations: ["product", "product.productUnit", "createdBy"],
                });
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

            const changes = await fastify.db.stockChange.findAllByBusinessId(businessId, productId);

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

            const change = await fastify.db.stockChange.findByIdAndBusinessId(changeId, businessId);

            if (!change) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Stock change not found" });
            }

            await fastify.db.dataSource.transaction(async (manager) => {
                const stockChangeRepo = manager.getRepository(
                    StockChange
                );
                const stockLevelRepo = manager.getRepository(
                    StockLevel
                );

                await stockChangeRepo.update(changeId, { deletedAt: new Date() });

                const stockLevel = await stockLevelRepo.findOne({ where: { productId: change.productId } });
                if (stockLevel) {
                    const newQuantity = stockLevel.quantity - change.quantity;
                    await stockLevelRepo.update(stockLevel.id, { quantity: newQuantity });
                }
            });

            return reply.code(httpStatus.NO_CONTENT).send();
        },
    );
}
