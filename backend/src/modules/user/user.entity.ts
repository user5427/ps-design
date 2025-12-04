import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    Index,
    JoinColumn,
    type Relation,
} from "typeorm";
import type { Business } from "../business/business.entity";
import type { RefreshToken } from "../refresh-token/refresh-token.entity";
import type { StockChange } from "../stock-change/stock-change.entity";
import { Role } from "./user.types";

@Entity("User")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", unique: true })
    email: string;

    @Column({ type: "varchar" })
    passwordHash: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "enum", enum: Role })
    role: Role;

    @Column({ type: "boolean", default: true })
    isPasswordResetRequired: boolean;

    @Column({ type: "uuid", nullable: true })
    @Index()
    businessId: string | null;

    @ManyToOne("Business", "users", { nullable: true })
    @JoinColumn({ name: "businessId" })
    business: Relation<Business> | null;

    @OneToMany("RefreshToken", "user")
    refreshTokens: Relation<RefreshToken[]>;

    @OneToMany("StockChange", "createdBy")
    createdStockChanges: Relation<StockChange[]>;

    @Column({ type: "timestamp", nullable: true })
    deletedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
