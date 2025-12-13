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
import type { UserRole } from "./user-role.entity";
import type { RoleScope } from "./role-scope.entity";
import type { Business } from "@/modules/business/business.entity";

@Entity("Role")
@Index(["businessId", "name"], { unique: true })
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "uuid" })
  @Index()
  businessId: string;

  @ManyToOne("Business", { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "businessId" })
  business: Relation<Business>;

  @Column({ type: "boolean", default: false })
  isSystemRole: boolean;

  @Column({ type: "boolean", default: true })
  isDeletable: boolean;

  @OneToMany("UserRole", "role")
  userRoles: Relation<UserRole[]>;

  @OneToMany("RoleScope", "role")
  roleScopes: Relation<RoleScope[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
