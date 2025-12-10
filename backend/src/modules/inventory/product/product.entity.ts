import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { ProductUnit } from "@/modules/inventory/product-unit/product-unit.entity";
import type { StockChange } from "@/modules/inventory/stock-change/stock-change.entity";
import type { StockLevel } from "@/modules/inventory/stock-level/stock-level.entity";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import type { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";

@Entity("Product")
@Unique(["businessId", "name"])
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @Column({ type: "boolean", default: false })
  isDisabled: boolean;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "products", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid" })
  @Index()
  productUnitId: string;

  @ManyToOne("ProductUnit", "products")
  @JoinColumn({ name: "productUnitId" })
  productUnit: Relation<ProductUnit>;

  @OneToMany("StockChange", "product")
  stockChanges: Relation<StockChange[]>;

  @OneToOne("StockLevel", "product")
  stockLevel: Relation<StockLevel> | null;

  @OneToMany("MenuItemBaseProduct", "product")
  menuItemBaseProducts: Relation<MenuItemBaseProduct[]>;

  @OneToMany("MenuItemVariationProduct", "product")
  menuItemVariationProducts: Relation<MenuItemVariationProduct[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
