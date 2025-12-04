import "reflect-metadata";
import { DataSource } from "typeorm";

export interface DataSourceConfig {
  url: string;
    synchronize: boolean;
  logging?: boolean;
}

export function createDataSource(config: DataSourceConfig): DataSource {
  return new DataSource({
    type: "postgres",
    url: config.url,
    synchronize: config.synchronize, // AUTO-MIGRATE DB SCHEMA CHANGES BASED ON ENTITIES 
    logging: config.logging ?? false,
    entities: [__dirname + "/../modules/**/*.entity.{ts,js}"],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
    subscribers: [],
  });
}
