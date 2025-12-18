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

@Entity("UserTempSession")
@Index(["originalUserId"], { unique: true, name: "IDX_user_temp_session_original_unique" })
export class UserTempSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  originalUserId: string;

  @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "originalUserId" })
  originalUser: Relation<User>;

  @Column({ type: "uuid" })
  @Index()
  tempUserId: string;

  @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "tempUserId" })
  tempUser: Relation<User>;

  @CreateDateColumn()
  createdAt: Date;
}
