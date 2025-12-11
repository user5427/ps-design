import type { FastifyInstance } from "fastify";
import { In } from "typeorm";
import type {
  FloorPlanResponse,
  FloorTable,
  UpdateFloorTableBody,
} from "@ps-design/schemas/order/floor";
import { DiningTable, DiningTableStatus, Order, OrderStatus } from "@/modules/order";
import { NotFoundError } from "@/shared/errors";

export async function getFloorPlan(
  fastify: FastifyInstance,
  businessId: string,
): Promise<FloorPlanResponse> {
  const tableRepo = fastify.db.dataSource.getRepository(DiningTable);
  const orderRepo = fastify.db.dataSource.getRepository(Order);

  const tables = await tableRepo.find({
    where: { businessId },
  });

  if (tables.length === 0) {
    return { tables: [] };
  }

  const tableIds = tables.map((t) => t.id);

  const openOrders = await orderRepo.find({
    where: {
      businessId,
      tableId: In(tableIds),
      status: OrderStatus.OPEN,
    },
  });

  const orderByTableId = new Map<string, string>();

  for (const order of openOrders) {
    if (order.tableId && !orderByTableId.has(order.tableId)) {
      orderByTableId.set(order.tableId, order.id);
    }
  }

  return {
    tables: tables.map((table) => ({
      id: table.id,
      label: table.label,
      capacity: table.capacity,
      status: table.status,
      reserved: table.reserved ?? false,
      orderId: orderByTableId.get(table.id) ?? null,
    })),
  };
}

export async function updateFloorTable(
  fastify: FastifyInstance,
  businessId: string,
  tableId: string,
  input: UpdateFloorTableBody,
): Promise<FloorTable> {
  const tableRepo = fastify.db.dataSource.getRepository(DiningTable);
  const orderRepo = fastify.db.dataSource.getRepository(Order);

  const table = await tableRepo.findOne({ where: { id: tableId, businessId } });

  if (!table) {
    throw new NotFoundError("Table not found");
  }

  if (typeof input.reserved === "boolean") {
    table.reserved = input.reserved;
  }

  if (input.status) {
    table.status = input.status as DiningTableStatus;
  }

  const saved = await tableRepo.save(table);

  const openOrder = await orderRepo.findOne({
    where: {
      businessId,
      tableId: saved.id,
      status: OrderStatus.OPEN,
    },
  });

  return {
    id: saved.id,
    label: saved.label,
    capacity: saved.capacity,
    status: saved.status,
    reserved: saved.reserved ?? false,
    orderId: openOrder?.id ?? null,
  };
}
