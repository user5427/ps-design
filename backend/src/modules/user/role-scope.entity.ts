import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import type { Role } from "./role.entity";
import type { Scope } from "./scope.entity";

@Entity("RoleScope")
@Index(["roleId", "scopeId"], { unique: true })
export class RoleScope {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  roleId: string;

  @ManyToOne("Role", "roleScopes", { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "roleId" })
  role: Relation<Role>;

  @Column({ type: "uuid" })
  scopeId: string;

  @ManyToOne("Scope", "roleScopes", { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "scopeId" })
  scope: Relation<Scope>;

  @CreateDateColumn()
  createdAt: Date;
}
