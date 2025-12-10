import "dotenv/config";
import { createDataSource } from "./data-source";

// CLI data source for migrations
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const dataSource = createDataSource({
  url: databaseUrl,
  synchronize: process.env.NODE_ENV !== "production",
  logging: true,
});

export default dataSource;
