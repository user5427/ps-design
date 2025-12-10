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
  Unique,
  UpdateDateColumn,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";

@Entity("MenuItemCategory")
@Unique(["businessId", "name"])
export class MenuItemCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", "menuItemCategories", { onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @OneToMany("MenuItem", "category")
  menuItems: Relation<MenuItem[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
