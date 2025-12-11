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
import type { User } from "@/modules/user/user.entity";
import type { Business } from "@/modules/business/business.entity";

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

@Entity("Availability")
export class Availability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 3 })
  dayOfWeek: DayOfWeek;

  @Column({ type: "time" })
  startTime: string; // HH:MM format

  @Column({ type: "time" })
  endTime: string; // HH:MM format

  @Column({ type: "boolean", default: false })
  isOvernight: boolean; // true if endTime is on the next day (e.g., 23:00 - 01:00)

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: Relation<User>;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
