import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { decimalTransformer } from "@/shared/decimal-transformer";
import type { Business } from "@/modules/business/business.entity";
import type { User } from "@/modules/user/user.entity";
import type { Product } from "@/modules/inventory/product/product.entity";
import { StockChangeType } from "./stock-change.types";

@Entity("StockChange")
@Index(["businessId"])
@Index(["businessId", "productId"])
export class StockChange {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 3,
    transformer: decimalTransformer,
  })
  quantity: number;

  @Column({ type: "enum", enum: StockChangeType })
  type: StockChangeType;

  @Column({ type: "date", nullable: true })
  expirationDate: Date | null;

  @Column({ type: "uuid" })
  businessId: string;

  @ManyToOne("Business", "stockChanges", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "uuid" })
  productId: string;

  @ManyToOne("Product", "stockChanges", { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Relation<Product>;

  @Column({ type: "uuid", nullable: true })
  createdByUserId: string | null;

  @ManyToOne("User", "createdStockChanges", { nullable: true })
  @JoinColumn({ name: "createdByUserId" })
  createdBy: Relation<User> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;
}
