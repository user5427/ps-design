import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";
import type { Payment } from "@/modules/payment/payment.entity";

@Entity("AppointmentPayment")
export class AppointmentPayment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  @Index({ unique: true })
  appointmentId: string;

  @OneToOne("Appointment", "payment", { onDelete: "CASCADE" })
  @JoinColumn({ name: "appointmentId" })
  appointment: Relation<Appointment>;

  @Column({ type: "uuid" })
  @Index({ unique: true })
  paymentId: string;

  @OneToOne("Payment", { cascade: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "paymentId" })
  payment: Relation<Payment>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
