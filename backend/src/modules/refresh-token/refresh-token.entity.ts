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
import type { User } from '@/modules/user/user.entity';

@Entity("RefreshToken")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @ManyToOne("User", "refreshTokens", { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: Relation<User>;

  @Column({ type: "varchar", unique: true })
  tokenHash: string;

  @Column({ type: "varchar", unique: true })
  @Index()
  jti: string;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column({ type: "timestamp", nullable: true })
  revokedAt: Date | null;

  @Column({ type: "varchar", nullable: true })
  ip: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
