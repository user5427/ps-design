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
import type { Business } from "@/modules/business/business.entity";
import { AuditActionType, AuditSecurityType, ActionResult } from "./audit-log.types";

@Entity("AuditBusinessLog")
@Index([ "entityType", "entityId" ])
@Index([ "businessId" ])
@Index([ "userId" ])
export class AuditBusinessLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    businessId: string;

    @ManyToOne("Business", "auditLogs", { onDelete: "CASCADE" })
    @JoinColumn({ name: "businessId" })
    business: Relation<Business>;

    @Column({ type: "uuid", nullable: true })
    userId: string | null;

    @ManyToOne("User", "auditLogs", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "userId" })
    user: Relation<User> | null;

    @Column({ type: "varchar", nullable: true })
    ip: string | null;

    @Column({ type: "varchar" })
    entityType: string;

    @Column({ type: "uuid" })
    entityId: string;

    @Column({
        type: "enum",
        enum: { ...AuditActionType, ...AuditSecurityType },
    })
    action: AuditActionType | AuditSecurityType;

    @Column({ type: "jsonb", nullable: true })
    oldValues: Record<string, any> | null;

    @Column({ type: "jsonb", nullable: true })
    newValues: Record<string, any> | null;

    @Column({
        type: "enum",
        enum: ActionResult,
        nullable: true,
    })
    result: ActionResult | null;

    @CreateDateColumn()
    createdAt: Date;
}
