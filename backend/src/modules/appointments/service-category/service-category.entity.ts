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
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";

@Entity("ServiceCategory")
@Unique(["businessId", "name"])
export class ServiceCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "serviceCategories", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @OneToMany("ServiceDefinition", "category")
  serviceDefinitions: Relation<ServiceDefinition[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
