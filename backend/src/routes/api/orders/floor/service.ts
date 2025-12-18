import type { FastifyInstance } from "fastify";
import { In, IsNull } from "typeorm";
import type {
  FloorPlanResponse,
  FloorTable,
  UpdateFloorTableBody,
} from "@ps-design/schemas/order/floor";
import {
  DiningTable,
  DiningTableStatus,
  Order,
  OrderItem,
  OrderItemStatus,
  OrderStatus,
} from "@/modules/order";
import { ConflictError, NotFoundError } from "@/shared/errors";
import type { CreateFloorTableBody } from "@ps-design/schemas/order/floor";

export async function getFloorPlan(
  fastify: FastifyInstance,
  businessId: string,
): Promise<FloorPlanResponse> {
  const tableRepo = fastify.db.dataSource.getRepository(DiningTable);
  const orderRepo = fastify.db.dataSource.getRepository(Order);

  const tables = await tableRepo.find({
    where: { businessId, deletedAt: IsNull() },
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

  // Determine which open orders actually have items that were sent
  // to the kitchen. Only those tables should be highlighted as ACTIVE.
  const ordersWithSentItems = new Set<string>();
  const openOrderIds = openOrders.map((o) => o.id);

  if (openOrderIds.length > 0) {
    const orderItemRepo = fastify.db.dataSource.getRepository(OrderItem);
    const sentItems = await orderItemRepo.find({
      where: {
        orderId: In(openOrderIds),
        status: OrderItemStatus.SENT,
        deletedAt: IsNull(),
      },
    });

    for (const item of sentItems) {
      ordersWithSentItems.add(item.orderId);
    }
  }

  return {
    tables: tables.map((table) => {
      const orderId = orderByTableId.get(table.id) ?? null;
      const hasSentItems = orderId ? ordersWithSentItems.has(orderId) : false;

      // Visual status rules for the floor plan:
      // - AVAILABLE (white/gray): no open order OR only unsent items.
      // - ACTIVE (green): there is an OPEN order with items sent to kitchen.
      // - ATTENTION (orange): manual override to highlight a table
      //   that needs service; this always wins over other states.
      let status: DiningTableStatus;
      if (table.status === DiningTableStatus.ATTENTION) {
        status = DiningTableStatus.ATTENTION;
      } else if (orderId && hasSentItems) {
        status = DiningTableStatus.ACTIVE;
      } else {
        status = DiningTableStatus.AVAILABLE;
      }

      return {
        id: table.id,
        label: table.label,
        capacity: table.capacity,
        status,
        reserved: table.reserved ?? false,
        orderId,
      };
    }),
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
  const orderItemRepo = fastify.db.dataSource.getRepository(OrderItem);

  const table = await tableRepo.findOne({
    where: { id: tableId, businessId, deletedAt: IsNull() },
  });

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

  let hasSentItems = false;
  if (openOrder) {
    const sentCount = await orderItemRepo.count({
      where: {
        orderId: openOrder.id,
        status: OrderItemStatus.SENT,
        deletedAt: IsNull(),
      },
    });
    hasSentItems = sentCount > 0;
  }

  // Keep the same visual rules as getFloorPlan so the
  // immediate response from this mutation matches what
  // the floor-plan query will later return:
  // - ATTENTION: preserved as an explicit highlight.
  // - ACTIVE: there is an OPEN order on this table with items sent.
  // - AVAILABLE: no open order or only unsent items.
  let status: DiningTableStatus;
  if (saved.status === DiningTableStatus.ATTENTION) {
    status = DiningTableStatus.ATTENTION;
  } else if (openOrder && hasSentItems) {
    status = DiningTableStatus.ACTIVE;
  } else {
    status = DiningTableStatus.AVAILABLE;
  }

  return {
    id: saved.id,
    label: saved.label,
    capacity: saved.capacity,
    status,
    reserved: saved.reserved ?? false,
    orderId: openOrder?.id ?? null,
  };
}

export async function createFloorTable(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateFloorTableBody,
): Promise<FloorTable> {
  const tableRepo = fastify.db.dataSource.getRepository(DiningTable);

  const existing = await tableRepo.findOne({
    where: { businessId, label: input.label, deletedAt: IsNull() },
  });

  if (existing) {
    throw new ConflictError("Table with this label already exists");
  }

  const saved = await tableRepo.save(
    tableRepo.create({
      businessId,
      label: input.label,
      capacity: input.capacity,
      status: DiningTableStatus.AVAILABLE,
      reserved: false,
    }),
  );

  return {
    id: saved.id,
    label: saved.label,
    capacity: saved.capacity,
    status: saved.status,
    reserved: saved.reserved ?? false,
    orderId: null,
  };
}

export async function deleteFloorTable(
  fastify: FastifyInstance,
  businessId: string,
  tableId: string,
): Promise<void> {
  const tableRepo = fastify.db.dataSource.getRepository(DiningTable);
  const orderRepo = fastify.db.dataSource.getRepository(Order);

  const table = await tableRepo.findOne({
    where: { id: tableId, businessId, deletedAt: IsNull() },
  });

  if (!table) {
    throw new NotFoundError("Table not found");
  }

  const openOrder = await orderRepo.findOne({
    where: {
      businessId,
      tableId: table.id,
      status: OrderStatus.OPEN,
    },
  });

  if (openOrder) {
    throw new ConflictError("Cannot delete table with an open order");
  }

  table.deletedAt = new Date();
  await tableRepo.save(table);
}
