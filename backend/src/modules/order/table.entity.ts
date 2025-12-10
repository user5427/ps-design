import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { Order } from "@/modules/order/order.entity";

export enum DiningTableStatus {
  AVAILABLE = "AVAILABLE",
  ACTIVE = "ACTIVE",
  ATTENTION = "ATTENTION",
}

@Entity("DiningTable")
@Index(["businessId"])
@Index(["businessId", "label"], { unique: true })
export class DiningTable {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  businessId: string;

  @ManyToOne("Business", "tables", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "varchar" })
  label: string;

  @Column({ type: "int" })
  capacity: number;

  @Column({ type: "enum", enum: DiningTableStatus })
  status: DiningTableStatus;

  @OneToMany("Order", "table")
  orders: Relation<Order[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
