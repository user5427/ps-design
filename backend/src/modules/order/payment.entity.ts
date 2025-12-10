import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { decimalTransformer } from "@/shared/decimal-transformer";
import type { Order } from "@/modules/order/order.entity";

export enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  GIFT_CARD = "GIFT_CARD",
}

@Entity("Payment")
@Index(["orderId"])
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  orderId: string;

  @ManyToOne("Order", "payments", { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Relation<Order>;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: "enum", enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: "varchar", nullable: true })
  externalReferenceId: string | null;

  @Column({ type: "boolean", default: false })
  isRefund: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
