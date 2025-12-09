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
import type { User } from "./user.entity";
import type { Role } from "./role.entity";

@Entity("UserRole")
@Index(["userId", "roleId"], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne("User", "roles", { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: Relation<User>;

  @Column({ type: "uuid" })
  roleId: string;

  @ManyToOne("Role", "userRoles", { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "roleId" })
  role: Relation<Role>;

  @CreateDateColumn()
  createdAt: Date;
}
