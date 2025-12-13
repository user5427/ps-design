import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { User } from "@/modules/user/user.entity";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";

@Entity("StaffService")
@Unique(["businessId", "employeeId", "serviceDefinitionId"])
export class StaffService {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "boolean", default: false })
  isDisabled: boolean;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "staffServices", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid" })
  @Index()
  employeeId: string;

  @ManyToOne("User", { onDelete: "CASCADE" })
  @JoinColumn({ name: "employeeId" })
  employee: Relation<User>;

  @Column({ type: "uuid" })
  @Index()
  serviceDefinitionId: string;

  @ManyToOne("ServiceDefinition", "staffServices", { onDelete: "CASCADE" })
  @JoinColumn({ name: "serviceDefinitionId" })
  serviceDefinition: Relation<ServiceDefinition>;

  @OneToMany("Appointment", "service")
  appointments: Relation<Appointment[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
