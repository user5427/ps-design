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
import type { Business } from "@/modules/business/business.entity";

@Entity("GiftCard")
@Unique(["businessId", "code"])
export class GiftCard {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  code: string;

  /** in cents */
  @Column({ type: "int" })
  value: number;

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  redeemedAt: Date | null;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
