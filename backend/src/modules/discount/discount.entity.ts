import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { MenuItem } from "@/modules/menu/menu-item";
import type { ServiceDefinition } from "@/modules/appointments/service-definition";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type DiscountTargetType = "ORDER" | "MENU_ITEM" | "SERVICE";

@Entity("Discount")
@Index(["businessId", "targetType"])
export class Discount {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  type: DiscountType;

  /** For PERCENTAGE: 0-100, for FIXED_AMOUNT: cents */
  @Column({ type: "int" })
  value: number;

  @Column({ type: "varchar" })
  targetType: DiscountTargetType;

  @Column({ type: "uuid", nullable: true })
  @Index()
  menuItemId: string | null;

  @ManyToOne("MenuItem", { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "menuItemId" })
  menuItem: Relation<MenuItem> | null;

  @Column({ type: "uuid", nullable: true })
  @Index()
  serviceDefinitionId: string | null;

  @ManyToOne("ServiceDefinition", { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "serviceDefinitionId" })
  serviceDefinition: Relation<ServiceDefinition> | null;

  @Column({ type: "timestamp", nullable: true })
  startsAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date | null;

  @Column({ type: "boolean", default: false })
  isDisabled: boolean;

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
