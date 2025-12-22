import {
  In,
  IsNull,
  type DataSource,
  type Repository,
  type EntityManager,
} from "typeorm";
import { BadRequestError, NotFoundError } from "@/shared/errors";
import { StockChangeType } from "@/modules/inventory/stock-change/stock-change.types";
import type { StockChangeRepository } from "@/modules/inventory/stock-change";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import type { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";
import { type Order, OrderStatus } from "./order.entity";
import { type OrderItem, OrderItemStatus } from "./order-item.entity";
import type { OrderItemVariation } from "./order-item-variation.entity";
import type { Payment, PaymentMethod } from "./payment.entity";

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  variationIds: string[];
}

export class OrderRepository {
  constructor(
    private dataSource: DataSource,
    private orderRepo: Repository<Order>,
    private orderItemRepo: Repository<OrderItem>,
    private orderItemVariationRepo: Repository<OrderItemVariation>,
    private paymentRepo: Repository<Payment>,
    private menuItemRepo: Repository<MenuItem>,
    private menuItemVariationRepo: Repository<MenuItemVariation>,
    private baseProductRepo: Repository<MenuItemBaseProduct>,
    private variationProductRepo: Repository<MenuItemVariationProduct>,
    private stockChangeRepo: StockChangeRepository,
  ) {}

  async getByIdAndBusinessId(id: string, businessId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, businessId },
      relations: [
        "orderItems",
        "orderItems.variations",
        "payments",
        "servedByUser",
      ],
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  }

  async createForTable(
    businessId: string,
    tableId: string | null,
  ): Promise<Order> {
    const where: any = {
      businessId,
      status: OrderStatus.OPEN,
      deletedAt: IsNull(),
    };

    if (tableId) {
      where.tableId = tableId;
    }

    const existingOpen = await this.orderRepo.findOne({
      where,
    });

    if (existingOpen) {
      return existingOpen;
    }

    const order = this.orderRepo.create({
      businessId,
      tableId,
      status: OrderStatus.OPEN,
      itemsTotal: 0,
      totalTax: 0,
      totalTip: 0,
      totalDiscount: 0,
      totalAmount: 0,
    });

    return this.orderRepo.save(order);
  }

  async updateItems(
    orderId: string,
    businessId: string,
    items: OrderItemInput[],
  ): Promise<Order> {
    const order = await this.getByIdAndBusinessId(orderId, businessId);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestError("Cannot modify a closed order");
    }

    return this.dataSource.transaction(async (manager) => {
      const menuItemIds = Array.from(new Set(items.map((i) => i.menuItemId)));
      const variationIds = Array.from(
        new Set(items.flatMap((i) => i.variationIds)),
      );

      const menuItems = await manager
        .getRepository(this.menuItemRepo.target)
        .find({
          where: { id: In(menuItemIds), businessId, deletedAt: IsNull() },
          relations: ["variations"],
        });

      const variations = variationIds.length
        ? await manager
            .getRepository(this.menuItemVariationRepo.target)
            .find({ where: { id: In(variationIds), deletedAt: IsNull() } })
        : [];

      const baseProducts = await manager
        .getRepository(this.baseProductRepo.target)
        .find({ where: { menuItemId: In(menuItemIds) } });

      const variationProducts = variationIds.length
        ? await manager
            .getRepository(this.variationProductRepo.target)
            .find({ where: { variationId: In(variationIds) } })
        : [];

      const menuItemById = new Map(menuItems.map((m) => [m.id, m]));
      const variationById = new Map(variations.map((v) => [v.id, v]));

      // Remove existing PENDING items and their variations
      const existingPending = await manager
        .getRepository(this.orderItemRepo.target)
        .find({
          where: { orderId, status: OrderItemStatus.PENDING },
          relations: ["variations"],
        });

      if (existingPending.length > 0) {
        const pendingIds = existingPending.map((i) => i.id);
        if (pendingIds.length > 0) {
          await manager
            .getRepository(this.orderItemVariationRepo.target)
            .delete({ orderItemId: In(pendingIds) });
          await manager
            .getRepository(this.orderItemRepo.target)
            .delete({ id: In(pendingIds) });
        }
      }

      // Create new pending items
      for (const input of items) {
        const menuItem = menuItemById.get(input.menuItemId);
        if (!menuItem) {
          throw new BadRequestError("Invalid menu item");
        }

        const activeVariations = input.variationIds
          .map((id) => variationById.get(id))
          .filter((v): v is MenuItemVariation => !!v && !v.isDisabled);

        const basePrice = menuItem.basePrice / 100;
        const totalVariationPrice =
          activeVariations.reduce(
            (sum, v) => sum + v.priceAdjustment / 100,
            0,
          ) || 0;

        const unitSalePrice = basePrice + totalVariationPrice;
        const lineTotal = unitSalePrice * input.quantity;

        const orderItem = manager
          .getRepository(this.orderItemRepo.target)
          .create({
            orderId,
            menuItemId: menuItem.id,
            snapName: menuItem.baseName,
            snapBasePrice: basePrice,
            unitSalePrice,
            quantity: input.quantity,
            status: OrderItemStatus.PENDING,
            lineTotal,
          });

        const savedItem = await manager
          .getRepository(this.orderItemRepo.target)
          .save(orderItem);

        if (activeVariations.length > 0) {
          const variationEntities = activeVariations.map((v) =>
            manager.getRepository(this.orderItemVariationRepo.target).create({
              orderItemId: savedItem.id,
              menuItemVariationId: v.id,
              snapVariationName: v.name,
              snapPriceAdjustment: v.priceAdjustment / 100,
            }),
          );

          await manager
            .getRepository(this.orderItemVariationRepo.target)
            .save(variationEntities);
        }
      }

      await this.recalculateTotals(manager, orderId, businessId);

      return this.getByIdAndBusinessId(orderId, businessId);
    });
  }

  async sendPendingItems(
    orderId: string,
    businessId: string,
    userId: string,
  ): Promise<Order> {
    const order = await this.getByIdAndBusinessId(orderId, businessId);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestError("Cannot send items for a closed order");
    }

    return this.dataSource.transaction(async (manager) => {
      const pendingItems = await manager
        .getRepository(this.orderItemRepo.target)
        .find({
          where: { orderId, status: OrderItemStatus.PENDING },
          relations: ["variations"],
        });

      if (pendingItems.length === 0) {
        return order;
      }

      await manager
        .getRepository(this.orderItemRepo.target)
        .update(
          { id: In(pendingItems.map((i) => i.id)) },
          { status: OrderItemStatus.SENT },
        );

      // Reduce inventory for base and variation products
      const menuItemIds = Array.from(
        new Set(pendingItems.map((i) => i.menuItemId)),
      );
      const variationIds = Array.from(
        new Set(
          pendingItems.flatMap((i) =>
            i.variations.map((v) => v.menuItemVariationId),
          ),
        ),
      );

      const baseProducts = await manager
        .getRepository(this.baseProductRepo.target)
        .find({ where: { menuItemId: In(menuItemIds) } });

      const variationProducts = variationIds.length
        ? await manager
            .getRepository(this.variationProductRepo.target)
            .find({ where: { variationId: In(variationIds) } })
        : [];

      const quantityByProduct = new Map<string, number>();

      for (const item of pendingItems) {
        const itemBaseProducts = baseProducts.filter(
          (bp) => bp.menuItemId === item.menuItemId,
        );
        for (const bp of itemBaseProducts) {
          const totalQty = bp.quantity * item.quantity;
          quantityByProduct.set(
            bp.productId,
            (quantityByProduct.get(bp.productId) || 0) - totalQty,
          );
        }

        for (const variation of item.variations) {
          const vProducts = variationProducts.filter(
            (vp) => vp.variationId === variation.menuItemVariationId,
          );
          for (const vp of vProducts) {
            const totalQty = vp.quantity * item.quantity;
            quantityByProduct.set(
              vp.productId,
              (quantityByProduct.get(vp.productId) || 0) - totalQty,
            );
          }
        }
      }

      for (const [productId, quantity] of quantityByProduct.entries()) {
        if (quantity === 0) continue;
        await this.stockChangeRepo.create({
          productId,
          quantity,
          type: StockChangeType.USAGE,
          businessId,
          createdByUserId: userId,
        });
      }

      await this.recalculateTotals(manager, orderId, businessId);

      return this.getByIdAndBusinessId(orderId, businessId);
    });
  }

  async updateTotals(
    orderId: string,
    businessId: string,
    tipAmount: number,
    discountAmount: number,
  ): Promise<Order> {
    const order = await this.getByIdAndBusinessId(orderId, businessId);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestError("Cannot update totals for a closed order");
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.getRepository(this.orderRepo.target).update(orderId, {
        totalTip: tipAmount,
        totalDiscount: discountAmount,
      });

      await this.recalculateTotals(manager, orderId, businessId);

      return this.getByIdAndBusinessId(orderId, businessId);
    });
  }

  async updateWaiter(
    orderId: string,
    businessId: string,
    servedByUserId: string | null,
  ): Promise<Order> {
    const order = await this.getByIdAndBusinessId(orderId, businessId);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestError("Cannot change waiter for a closed order");
    }

    await this.orderRepo.update(orderId, { servedByUserId });

    return this.getByIdAndBusinessId(orderId, businessId);
  }

  async addPayment(
    orderId: string,
    businessId: string,
    amount: number,
    method: PaymentMethod,
    externalReferenceId: string | null,
    isRefund: boolean,
  ): Promise<Order> {
    const order = await this.getByIdAndBusinessId(orderId, businessId);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestError("Cannot pay a cancelled order");
    }

    return this.dataSource.transaction(async (manager) => {
      const payment = manager.getRepository(this.paymentRepo.target).create({
        orderId,
        amount,
        method,
        externalReferenceId,
        isRefund,
      });

      await manager.getRepository(this.paymentRepo.target).save(payment);

      const refreshed = await this.getByIdAndBusinessId(orderId, businessId);

      const totalPaid = refreshed.payments
        .filter((p) => !p.isRefund)
        .reduce((sum, p) => sum + p.amount, 0);

      const totalRefunded = refreshed.payments
        .filter((p) => p.isRefund)
        .reduce((sum, p) => sum + p.amount, 0);

      let newStatus = refreshed.status;

      if (!isRefund && totalPaid >= refreshed.totalAmount) {
        newStatus = OrderStatus.PAID;
      }

      if (isRefund && totalRefunded > 0) {
        newStatus = OrderStatus.REFUNDED;
      }

      if (newStatus !== refreshed.status) {
        await manager.getRepository(this.orderRepo.target).update(orderId, {
          status: newStatus,
        });
      }

      return this.getByIdAndBusinessId(orderId, businessId);
    });
  }

  async cancel(orderId: string, businessId: string): Promise<Order> {
    const order = await this.getByIdAndBusinessId(orderId, businessId);

    if (order.status !== OrderStatus.OPEN) {
      throw new BadRequestError("Only open orders can be cancelled");
    }

    const hasPayments = order.payments.some((p) => !p.isRefund);
    if (hasPayments) {
      throw new BadRequestError("Cannot cancel an order with payments");
    }

    await this.orderRepo.update(orderId, { status: OrderStatus.CANCELLED });
    return this.getByIdAndBusinessId(orderId, businessId);
  }

  private async recalculateTotals(
    manager: EntityManager,
    orderId: string,
    businessId: string,
  ): Promise<void> {
    const orderItemRepo = manager.getRepository(this.orderItemRepo.target);
    const orderRepo = manager.getRepository(this.orderRepo.target);

    const items = await orderItemRepo.find({
      where: { orderId, deletedAt: IsNull() },
      relations: ["menuItem", "menuItem.category", "menuItem.category.tax"],
    });

    const itemsTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    const order = await orderRepo.findOne({
      where: { id: orderId, businessId },
    });
    if (!order) return;

    let totalTax = 0;

    if (itemsTotal > 0) {
      const effectiveDiscount = Math.max(
        0,
        Math.min(order.totalDiscount, itemsTotal),
      );

      for (const item of items) {
        const taxRate = item.menuItem?.category?.tax
          ? Number(item.menuItem.category.tax.rate)
          : 0;

        if (!taxRate) {
          continue;
        }

        const share = item.lineTotal / itemsTotal;
        const itemDiscount = effectiveDiscount * share;
        const taxableAmount = Math.max(0, item.lineTotal - itemDiscount);

        const lineTax = Number(((taxableAmount * taxRate) / 100).toFixed(2));

        totalTax += lineTax;
      }
    }

    const rawTotalAmount =
      itemsTotal + totalTax + order.totalTip - order.totalDiscount;
    const totalAmount = Math.max(0, Number(rawTotalAmount.toFixed(2)));

    await orderRepo.update(orderId, {
      itemsTotal,
      totalTax,
      totalAmount,
    });
  }
}
