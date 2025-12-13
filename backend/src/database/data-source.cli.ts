import "dotenv/config";
import { createDataSource } from "./data-source";

// CLI data source for migrations
const dataSource = createDataSource({
  url: process.env.DATABASE_URL || "",
  synchronize: process.env.NODE_ENV !== "production",
  logging: true,
});

export default dataSource;
