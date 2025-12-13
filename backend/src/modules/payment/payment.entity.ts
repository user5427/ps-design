import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
    UpdateDateColumn,
} from "typeorm";
import type { Business } from "@/modules/business/business.entity";
import type { User } from "@/modules/user/user.entity";
import type { PaymentLineItem } from "./payment-line-item.entity";

export type PaymentMethod = "CASH" | "GIFTCARD" | "STRIPE";
export type PaymentStatus = "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED";

@Entity("Payment")
export class Payment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "enum", enum: ["CASH", "GIFTCARD", "STRIPE"] })
    method: PaymentMethod;

    @Column({ type: "enum", enum: ["COMPLETED", "REFUNDED", "PARTIALLY_REFUNDED"], default: "COMPLETED" })
    status: PaymentStatus;

    @Column({ type: "int" })
    amount: number;

    @Column({ type: "int", default: 0 })
    tipAmount: number;

    @Column({ type: "int" })
    totalAmount: number;

    @Column({ type: "timestamp" })
    paidAt: Date;

    @Column({ type: "timestamp", nullable: true })
    refundedAt: Date | null;

    @Column({ type: "uuid", nullable: true })
    refundedById: string | null;

    @ManyToOne("User", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "refundedById" })
    refundedBy: Relation<User> | null;

    @Column({ type: "text", nullable: true })
    refundReason: string | null;

    @Column({ type: "varchar", nullable: true })
    externalPaymentId: string | null;

    @Column({ type: "uuid" })
    @Index()
    businessId: string;

    @ManyToOne("Business", { onDelete: "CASCADE" })
    @JoinColumn({ name: "businessId" })
    business: Relation<Business>;

    @Column({ type: "uuid" })
    paidById: string;

    @ManyToOne("User", { onDelete: "SET NULL" })
    @JoinColumn({ name: "paidById" })
    paidBy: Relation<User>;

    @OneToMany("PaymentLineItem", "payment", { cascade: true })
    lineItems: Relation<PaymentLineItem[]>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
