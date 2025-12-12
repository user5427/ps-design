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
import { decimalTransformer } from "@/shared/decimal-transformer";
import type { Business } from "@/modules/business/business.entity";
import type { Category } from "@/modules/category/category.entity";
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";

@Entity("ServiceDefinition")
@Unique(["businessId", "name"])
export class ServiceDefinition {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

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

  @ManyToOne("Business", "serviceDefinitions", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid", nullable: true })
  @Index()
  categoryId: string | null;

  @ManyToOne("Category", "serviceDefinitions", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category: Relation<Category> | null;

  @OneToMany("StaffService", "serviceDefinition")
  staffServices: Relation<StaffService[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
