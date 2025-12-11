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
  UpdateDateColumn,
} from "typeorm";
import { decimalTransformer } from "@/shared/decimal-transformer";
import type { Business } from "@/modules/business/business.entity";
import type { User } from "@/modules/user/user.entity";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import type { Availability } from "@/modules/appointments/availability/availability.entity";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";

@Entity("StaffService")
export class StaffService {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ type: "int" })
  baseDuration: number; // in minutes

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

  @OneToMany("Availability", "staffService")
  availabilities: Relation<Availability[]>;

  @OneToMany("Appointment", "service")
  appointments: Relation<Appointment[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
