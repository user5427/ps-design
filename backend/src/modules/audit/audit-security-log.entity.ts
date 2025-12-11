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
import type { User } from "@/modules/user/user.entity";
import { AuditSecurityType, ActionResult } from "./audit-log.types";

@Entity("AuditSecurityLog")
@Index([ "userId" ])
export class AuditSecurityLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid", nullable: true })
    userId: string | null;

    @ManyToOne("User", "auditLogs", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "userId" })
    user: Relation<User> | null;

    @Column({ type: "varchar", nullable: true })
    ip: string | null;

    @Column({
        type: "enum",
        enum: AuditSecurityType,
    })
    action: AuditSecurityType;

    @Column({
        type: "enum",
        enum: ActionResult,
        nullable: true,
    })
    result: ActionResult | null;

    @CreateDateColumn()
    createdAt: Date;
}
