import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { Product } from "@/modules/inventory/product/product.entity";
import type { ProductUnit } from "@/modules/inventory/product-unit/product-unit.entity";
import type { StockChange } from "@/modules/inventory/stock-change/stock-change.entity";
import { User } from "@/modules/user/user.entity";
import type { Category } from "@/modules/category/category.entity";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";

@Entity("Business")
export class Business {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "boolean", default: false })
  isDefault: boolean;

  @OneToMany(() => User, (user) => user.business)
  users: Relation<User[]>;

  @OneToMany("ProductUnit", "business")
  productUnits: Relation<ProductUnit[]>;

  @OneToMany("Product", "business")
  products: Relation<Product[]>;

  @OneToMany("StockChange", "business")
  stockChanges: Relation<StockChange[]>;

  @OneToMany("Category", "business")
  categories: Relation<Category[]>;

  @OneToMany("MenuItem", "business")
  menuItems: Relation<MenuItem[]>;

  @OneToMany("ServiceDefinition", "business")
  serviceDefinitions: Relation<ServiceDefinition[]>;

  @OneToMany("StaffService", "business")
  staffServices: Relation<StaffService[]>;

  @OneToMany("Appointment", "business")
  appointments: Relation<Appointment[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
