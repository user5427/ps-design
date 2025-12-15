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
import type { Business } from "@/modules/business/business.entity";
import type { DiningTable } from "@/modules/order/table.entity";
import type { OrderItem } from "@/modules/order/order-item.entity";
import type { Payment } from "@/modules/order/payment.entity";
import type { User } from "@/modules/user";

export enum OrderStatus {
  OPEN = "OPEN",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

@Entity("Order")
@Index(["businessId"])
@Index(["businessId", "tableId"])
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  businessId: string;

  @ManyToOne("Business", "orders", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid", nullable: true })
  @Index()
  tableId: string | null;

  @ManyToOne("DiningTable", "orders", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "tableId" })
  table: Relation<DiningTable> | null;

  @Column({ type: "uuid", nullable: true })
  @Index()
  servedByUserId: string | null;

  @ManyToOne("User", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "servedByUserId" })
  servedByUser: Relation<User> | null;

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.OPEN })
  status: OrderStatus;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  itemsTotal: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalTax: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  totalTip: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  totalDiscount: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalAmount: number;

  @OneToMany("OrderItem", "order")
  orderItems: Relation<OrderItem[]>;

  @OneToMany("Payment", "order")
  payments: Relation<Payment[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
