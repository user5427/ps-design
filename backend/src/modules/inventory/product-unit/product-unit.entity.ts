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
import type { Product } from "@/modules/inventory/product/product.entity";

@Entity("ProductUnit")
@Index("IDX_product_unit_business_name_unique_active", ["businessId", "name"], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class ProductUnit {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", nullable: true })
  symbol: string | null;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "productUnits", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @OneToMany("Product", "productUnit")
  products: Relation<Product[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
