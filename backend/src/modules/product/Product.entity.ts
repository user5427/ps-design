import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    Index,
    Unique,
    JoinColumn,
    type Relation,
} from "typeorm";
import type { Business } from "../business/Business.entity";
import type { ProductUnit } from "../product-unit/ProductUnit.entity";
import type { StockChange } from "../stock-change/StockChange.entity";
import type { StockLevel } from "../stock-level/StockLevel.entity";

@Entity("Product")
@Unique(["businessId", "name"])
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    name: string;

    @Column({ type: "varchar", nullable: true })
    description: string | null;

    @Column({ type: "boolean", default: false })
    isDisabled: boolean;

    @Column({ type: "uuid" })
    @Index()
    businessId: string;

    @ManyToOne("Business", "products", { onDelete: "CASCADE" })
    @JoinColumn({ name: "businessId" })
    business: Relation<Business>;

    @Column({ type: "uuid" })
    @Index()
    productUnitId: string;

    @ManyToOne("ProductUnit", "products")
    @JoinColumn({ name: "productUnitId" })
    productUnit: Relation<ProductUnit>;

    @OneToMany("StockChange", "product")
    stockChanges: Relation<StockChange[]>;

    @OneToOne("StockLevel", "product")
    stockLevel: Relation<StockLevel> | null;

    @Column({ type: "timestamp", nullable: true })
    deletedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
