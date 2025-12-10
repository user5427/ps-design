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
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { Product } from "@/modules/inventory/product/product.entity";

@Entity("MenuItemBaseProduct")
@Unique(["menuItemId", "productId"])
export class MenuItemBaseProduct {
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
  menuItemId: string;

  @ManyToOne("MenuItem", "baseProducts", { onDelete: "CASCADE" })
  @JoinColumn({ name: "menuItemId" })
  menuItem: Relation<MenuItem>;

  @Column({ type: "uuid" })
  @Index()
  productId: string;

  @ManyToOne("Product", "menuItemBaseProducts", { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Relation<Product>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
