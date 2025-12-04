import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    OneToOne,
    Index,
    JoinColumn,
    type Relation,
} from "typeorm";
import type { Product } from "../product/Product.entity";
import { decimalTransformer } from "../../shared/decimal-transformer";

@Entity("StockLevel")
@Index(["businessId"])
@Index(["businessId", "productId"])
export class StockLevel {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    businessId: string;

    @Column({ type: "decimal", precision: 12, scale: 3, transformer: decimalTransformer })
    quantity: number;

    @Column({ type: "uuid", unique: true })
    productId: string;

    @OneToOne("Product", "stockLevel", { onDelete: "CASCADE" })
    @JoinColumn({ name: "productId" })
    product: Relation<Product>;

    @UpdateDateColumn()
    updatedAt: Date;
}
