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
import type { MenuItemCategory } from "@/modules/menu/menu-item-category/menu-item-category.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";

@Entity("MenuItem")
@Unique(["businessId", "baseName"])
export class MenuItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  baseName: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  basePrice: number;

  @Column({ type: "boolean", default: false })
  isDisabled: boolean;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "menuItems", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid", nullable: true })
  @Index()
  categoryId: string | null;

  @ManyToOne("MenuItemCategory", "menuItems", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category: Relation<MenuItemCategory> | null;

  @OneToMany("MenuItemVariation", "menuItem")
  variations: Relation<MenuItemVariation[]>;

  @OneToMany("MenuItemBaseProduct", "menuItem")
  baseProducts: Relation<MenuItemBaseProduct[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
