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
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";
import { MenuItemVariationType } from "./menu-item-variation.types";

@Entity("MenuItemVariation")
@Unique(["menuItemId", "name"])
export class MenuItemVariation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", length: 50 })
  type: MenuItemVariationType;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
    default: 0,
  })
  priceAdjustment: number;

  @Column({ type: "boolean", default: false })
  isDisabled: boolean;

  @Column({ type: "uuid" })
  @Index()
  menuItemId: string;

  @ManyToOne("MenuItem", "variations", { onDelete: "CASCADE" })
  @JoinColumn({ name: "menuItemId" })
  menuItem: Relation<MenuItem>;

  @OneToMany("MenuItemVariationProduct", "variation")
  addonProducts: Relation<MenuItemVariationProduct[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
