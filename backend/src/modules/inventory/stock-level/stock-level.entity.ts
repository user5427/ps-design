import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { decimalTransformer } from '@/shared/decimal-transformer';
import type { Product } from '@/modules/inventory/product/product.entity';

@Entity("StockLevel")
@Index(["businessId"])
@Index(["businessId", "productId"])
export class StockLevel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  businessId: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({ type: "uuid", unique: true })
  productId: string;

  @OneToOne("Product", "stockLevel", { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Relation<Product>;

  @UpdateDateColumn()
  updatedAt: Date;
}
