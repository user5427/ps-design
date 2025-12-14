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
import type { Category } from "@/modules/category/category.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";

@Entity("MenuItem")
@Index(
  "IDX_menu_item_business_base_name_unique_active",
  ["businessId", "baseName"],
  {
    unique: true,
    where: '"deletedAt" IS NULL',
  },
)
export class MenuItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  baseName: string;

  /** Price in cents */
  @Column({ type: "int" })
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

  @ManyToOne("Category", "menuItems", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "categoryId" })
  category: Relation<Category> | null;

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
