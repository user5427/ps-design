import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { decimalTransformer } from "@/shared/decimal-transformer";
import type { Order } from "@/modules/order/order.entity";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { OrderItemVariation } from "@/modules/order/order-item-variation.entity";

export enum OrderItemStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  VOIDED = "VOIDED",
}

@Entity("OrderItem")
@Index(["orderId"])
@Index(["orderId", "menuItemId"])
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  orderId: string;

  @ManyToOne("Order", "orderItems", { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Relation<Order>;

  @Column({ type: "uuid" })
  menuItemId: string;

  @ManyToOne("MenuItem", "orderItems", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "menuItemId" })
  menuItem: Relation<MenuItem>;

  @Column({ type: "varchar" })
  snapName: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  snapBasePrice: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitSalePrice: number;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "enum", enum: OrderItemStatus })
  status: OrderItemStatus;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  lineTotal: number;

  @OneToMany("OrderItemVariation", "orderItem")
  variations: Relation<OrderItemVariation[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
