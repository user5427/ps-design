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
import { Business } from "@/modules/business/business.entity";
import type { StockChange } from "@/modules/inventory/stock-change/stock-change.entity";
import type { RefreshToken } from "@/modules/refresh-token/refresh-token.entity";
import type { UserRole } from "./user-role.entity";

@Entity("User")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  email: string;

  @Column({ type: "varchar" })
  passwordHash: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "boolean", default: true })
  isPasswordResetRequired: boolean;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne(
    () => Business,
    (business) => business.users,
    { nullable: false, onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @OneToMany("UserRole", "user")
  roles: Relation<UserRole[]>;

  @OneToMany("UserRole", "user")
  roles: Relation<UserRole[]>;

  @OneToMany("RefreshToken", "user")
  refreshTokens: Relation<RefreshToken[]>;

  @OneToMany("StockChange", "createdBy")
  createdStockChanges: Relation<StockChange[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
