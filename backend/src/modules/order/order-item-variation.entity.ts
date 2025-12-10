import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { decimalTransformer } from "@/shared/decimal-transformer";
import type { OrderItem } from "@/modules/order/order-item.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";

@Entity("OrderItemVariation")
@Index(["orderItemId"])
@Index(["orderItemId", "menuItemVariationId"])
export class OrderItemVariation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  orderItemId: string;

  @ManyToOne("OrderItem", "variations", { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderItemId" })
  orderItem: Relation<OrderItem>;

  @Column({ type: "uuid" })
  menuItemVariationId: string;

  @ManyToOne("MenuItemVariation", "orderItemVariations", {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "menuItemVariationId" })
  menuItemVariation: Relation<MenuItemVariation>;

  @Column({ type: "varchar" })
  snapVariationName: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  snapPriceAdjustment: number;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
