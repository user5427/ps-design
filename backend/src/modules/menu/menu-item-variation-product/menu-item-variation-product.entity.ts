import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { decimalTransformer } from "@/shared/decimal-transformer";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import type { Product } from "@/modules/inventory/product/product.entity";

@Entity("MenuItemVariationProduct")
@Unique(["variationId", "productId"])
export class MenuItemVariationProduct {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({ type: "uuid" })
  @Index()
  variationId: string;

  @ManyToOne("MenuItemVariation", "addonProducts", { onDelete: "CASCADE" })
  @JoinColumn({ name: "variationId" })
  variation: Relation<MenuItemVariation>;

  @Column({ type: "uuid" })
  @Index()
  productId: string;

  @ManyToOne("Product", "menuItemVariationProducts", { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Relation<Product>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
