import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { User } from "@/modules/user/user.entity";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";
import type { PaymentLineItem } from "./payment-line-item.entity";

export type PaymentMethod = "CASH" | "GIFTCARD" | "STRIPE";

@Entity("AppointmentPayment")
export class AppointmentPayment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  serviceName: string;

  @Column({ type: "int" })
  servicePrice: number;

  @Column({ type: "int" })
  serviceDuration: number;

  @Column({ type: "varchar" })
  employeeName: string;

  @Column({ type: "uuid" })
  employeeId: string;

  @Column({ type: "varchar" })
  paymentMethod: PaymentMethod;

  @Column({ type: "int", default: 0 })
  tipAmount: number;

  @Column({ type: "int" })
  totalAmount: number;

  @Column({ type: "timestamptz" })
  paidAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  refundedAt: Date | null;

  @Column({ type: "uuid", nullable: true })
  refundedById: string | null;

  @ManyToOne("User", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "refundedById" })
  refundedBy: Relation<User> | null;

  @Column({ type: "text", nullable: true })
  refundReason: string | null;

  @Column({ type: "uuid" })
  @Index({ unique: true })
  appointmentId: string;

  @OneToOne("Appointment", "payment", { onDelete: "CASCADE" })
  @JoinColumn({ name: "appointmentId" })
  appointment: Relation<Appointment>;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid" })
  paidById: string;

  @ManyToOne("User", { onDelete: "SET NULL" })
  @JoinColumn({ name: "paidById" })
  paidBy: Relation<User>;

  @OneToMany("PaymentLineItem", "payment", { cascade: true })
  lineItems: Relation<PaymentLineItem[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
