import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import { getBusinessId } from "../../../../shared/auth-utils";
import { isUniqueConstraintError } from "../../../../shared/prisma-error-utils";
import { uuid } from "../../../../shared/zod-schemas";

const MIN_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_SYMBOL_LENGTH = 10;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_LENGTH} characters`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;
const MIN_SYMBOL_MESSAGE = `Symbol must be at least ${MIN_LENGTH} characters`;
const MAX_SYMBOL_MESSAGE = `Symbol must be at most ${MAX_SYMBOL_LENGTH} characters`;

const unitIdParam = z.object({ unitId: uuid() });

const createProductUnitSchema = z.object({
    name: z
        .string()
        .min(MIN_LENGTH, MIN_NAME_MESSAGE)
        .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
    symbol: z
        .string()
        .min(MIN_LENGTH, MIN_SYMBOL_MESSAGE)
        .max(MAX_SYMBOL_LENGTH, MAX_SYMBOL_MESSAGE)
        .optional(),
});

const updateProductUnitSchema = z.object({
    name: z
        .string()
        .min(MIN_LENGTH, MIN_NAME_MESSAGE)
        .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
        .optional(),
    symbol: z
        .string()
        .min(MIN_LENGTH, MIN_SYMBOL_MESSAGE)
        .max(MAX_SYMBOL_LENGTH, MAX_SYMBOL_MESSAGE)
        .optional(),
});

export default async function unitsRoutes(fastify: FastifyInstance) {
    const server = fastify.withTypeProvider<ZodTypeProvider>();

    server.get(
        "/",
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
        "/",
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
            } catch (error) {
                if (isUniqueConstraintError(error)) {
                    return reply.code(httpStatus.CONFLICT).send({ message: "Product unit with this name already exists" });
                }
                throw error;
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
                Params: z.infer<typeof unitIdParam>;
                Body: z.infer<typeof updateProductUnitSchema>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { unitId } = request.params;

            const unit = await fastify.prisma.productUnit.findUnique({
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
            } catch (error) {
                if (isUniqueConstraintError(error)) {
                    return reply.code(httpStatus.CONFLICT).send({ message: "Product unit with this name already exists" });
                }
                throw error;
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
                Params: z.infer<typeof unitIdParam>;
            }>,
            reply: FastifyReply,
        ) => {
            const businessId = getBusinessId(request, reply);
            if (!businessId) return;

            const { unitId } = request.params;

            const unit = await fastify.prisma.productUnit.findUnique({
                where: { id: unitId, businessId, deletedAt: null },
            });

            if (!unit) {
                return reply.code(httpStatus.NOT_FOUND).send({ message: "Product unit not found" });
            }

            const productsCount = await fastify.prisma.product.count({
                where: { productUnitId: unitId, deletedAt: null },
            });

            if (productsCount > 0) {
                return reply.code(httpStatus.CONFLICT).send({ message: "Cannot delete product unit that is in use by products" });
            }

            await fastify.prisma.productUnit.update({
                where: { id: unitId },
                data: { deletedAt: new Date() },
            });

            return reply.code(httpStatus.NO_CONTENT).send();
        },
    );
}
