import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { User } from "@/modules/user/user.entity";
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";

export type AppointmentStatus = "RESERVED" | "CANCELLED" | "PAID";

@Entity("Appointment")
export class Appointment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  customerName: string;

  @Column({ type: "varchar", nullable: true })
  customerPhone: string | null;

  @Column({ type: "varchar", nullable: true })
  customerEmail: string | null;

  @Column({ type: "timestamptz" })
  @Index()
  startTime: Date;

  @Column({ type: "varchar", default: "RESERVED" })
  status: AppointmentStatus;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "appointments", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid" })
  @Index()
  serviceId: string;

  @ManyToOne("StaffService", "appointments", { onDelete: "CASCADE" })
  @JoinColumn({ name: "serviceId" })
  service: Relation<StaffService>;

  @Column({ type: "uuid" })
  createdById: string;

  @ManyToOne("User", { onDelete: "SET NULL" })
  @JoinColumn({ name: "createdById" })
  createdBy: Relation<User>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
