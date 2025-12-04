import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    type Relation,
} from "typeorm";
import type { User } from "../user/user.entity";
import type { ProductUnit } from "../product-unit/product-unit.entity";
import type { Product } from "../product/product.entity";
import type { StockChange } from "../stock-change/stock-change.entity";

@Entity("Business")
export class Business {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    name: string;

    @OneToMany("User", "business")
    users: Relation<User[]>;

    @OneToMany("ProductUnit", "business")
    productUnits: Relation<ProductUnit[]>;

    @OneToMany("Product", "business")
    products: Relation<Product[]>;

    @OneToMany("StockChange", "business")
    stockChanges: Relation<StockChange[]>;

    @Column({ type: "timestamp", nullable: true })
    deletedAt: Date | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
