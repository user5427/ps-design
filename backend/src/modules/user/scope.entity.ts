import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { RoleScope } from "./role-scope.entity";

@Entity("Scope")
export class ScopeEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @OneToMany("RoleScope", "scope")
  roleScopes: Relation<RoleScope[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
