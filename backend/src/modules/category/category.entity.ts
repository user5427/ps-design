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
import type { Business } from "@/modules/business/business.entity";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import type { Tax } from "@/modules/tax/tax.entity";

@Entity("Category")
@Index("IDX_category_business_name_unique_active", ["businessId", "name"], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "categories", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @OneToMany("MenuItem", "category")
  menuItems: Relation<MenuItem[]>;

  @OneToMany("ServiceDefinition", "category")
  serviceDefinitions: Relation<ServiceDefinition[]>;

  @Column({ type: "uuid", nullable: true })
  taxId: string | null;

  @ManyToOne("Tax", { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "taxId" })
  tax: Relation<Tax> | null;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
