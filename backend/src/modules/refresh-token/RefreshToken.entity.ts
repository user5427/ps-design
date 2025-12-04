import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    Index,
    JoinColumn,
    type Relation,
} from "typeorm";
import type { User } from "../user/User.entity";

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
