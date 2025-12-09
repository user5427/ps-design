import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "./user-role.entity";
import { RoleScope } from "./user-scope.entity";

@Entity("Role")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @OneToMany("UserRole", "role")
  userRoles: Relation<UserRole[]>;

  @OneToMany("RoleScope", "role")
  roleScopes: Relation<RoleScope[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
