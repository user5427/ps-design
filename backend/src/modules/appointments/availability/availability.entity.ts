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
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

@Entity("Availability")
export class Availability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 3 })
  dayOfWeek: DayOfWeek;

  @Column({ type: "time" })
  startTimeLocal: string; // HH:MM format

  @Column({ type: "time" })
  endTimeLocal: string; // HH:MM format

  @Column({ type: "uuid" })
  @Index()
  serviceId: string;

  @ManyToOne("StaffService", "availabilities", { onDelete: "CASCADE" })
  @JoinColumn({ name: "serviceId" })
  staffService: Relation<StaffService>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
