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
import type { AppointmentPayment } from "./appointment-payment.entity";

export type LineItemType = "SERVICE" | "TIP" | "DISCOUNT" | "TAX";

@Entity("AppointmentPaymentLineItem")
export class PaymentLineItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  type: LineItemType;

  @Column({ type: "varchar" })
  label: string;

  //  in cents (negative for discounts)
  @Column({ type: "int" })
  amount: number;

  @Column({ type: "uuid" })
  @Index()
  paymentId: string;

  @ManyToOne("AppointmentPayment", "lineItems", { onDelete: "CASCADE" })
  @JoinColumn({ name: "paymentId" })
  payment: Relation<AppointmentPayment>;

  @CreateDateColumn()
  createdAt: Date;
}
