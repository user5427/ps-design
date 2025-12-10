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
import type { User } from "@/modules/user/user.entity";
import type { MenuItemCategory } from "@/modules/menu/menu-item-category/menu-item-category.entity";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";

@Entity("Business")
export class Business {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @OneToMany("User", "business")
  users: Relation<User[]>;

  @OneToMany("ProductUnit", "business")
  productUnits: Relation<ProductUnit[]>;

  @OneToMany("Product", "business")
  products: Relation<Product[]>;

  @OneToMany("StockChange", "business")
  stockChanges: Relation<StockChange[]>;

  @OneToMany("MenuItemCategory", "business")
  menuItemCategories: Relation<MenuItemCategory[]>;

  @OneToMany("MenuItem", "business")
  menuItems: Relation<MenuItem[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
