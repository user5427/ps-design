import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import type { Tax } from "@/modules/tax/tax.entity";

@Entity("Country")
export class Country {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  name: string;

  @Column({ type: "varchar", unique: true, length: 2 })
  code: string;

  @Column({ type: "varchar", nullable: true })
  description: string | null;

  @OneToMany("Tax", "country")
  taxes: Relation<Tax[]>;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
