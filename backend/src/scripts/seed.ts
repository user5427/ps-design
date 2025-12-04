import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { createDataSource } from "../database/data-source";
import { Business } from "../modules/business";
import { Role, User } from "../modules/user";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Configure it in .env");
  }

  const dataSource = createDataSource({
    url: connectionString,
    synchronize: true,
    logging: true,
  });

  await dataSource.initialize();
  console.log("TypeORM DataSource initialized");

  const businessRepo = dataSource.getRepository(Business);
  const userRepo = dataSource.getRepository(User);

  try {
    // Create or reuse a default business
    const businessName = "Default Business";
    let business = await businessRepo.findOne({
      where: { name: businessName },
    });
    if (!business) {
      business = businessRepo.create({ name: businessName });
      business = await businessRepo.save(business);
      console.log(`Created business: ${business.name}`);
    } else {
      console.log(`Using existing business: ${business.name}`);
    }

    // Default password for initial users
    const defaultPassword = "Geras123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Initial users to create/upsert
    const users: Array<{
      email: string;
      name: string;
      role: Role;
      businessId?: string | null;
      isPasswordResetRequired?: boolean;
    }> = [
      {
        email: "superadmin@demo.local",
        name: "SupAdminas",
        role: Role.SUPER_ADMIN,
        businessId: null,
        isPasswordResetRequired: true,
      },
      {
        email: "admin@demo.local",
        name: "AdminasUseris",
        role: Role.ADMIN,
        businessId: business.id,
        isPasswordResetRequired: true,
      },
      {
        email: "user@demo.local",
        name: "Johnny",
        role: Role.USER,
        businessId: business.id,
        isPasswordResetRequired: true,
      },
    ];

    for (const u of users) {
      let existing = await userRepo.findOne({ where: { email: u.email } });
      if (!existing) {
        existing = userRepo.create({
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash,
          isPasswordResetRequired: u.isPasswordResetRequired ?? true,
          businessId: u.businessId ?? undefined,
        });
        existing = await userRepo.save(existing);
        console.log(`Created user: ${existing.email} (${existing.role})`);
      } else {
        console.log(
          `User already exists: ${existing.email} (${existing.role})`,
        );
      }
    }

    console.log("Seed complete. You can login with the default password.");
    console.log(`Default password: ${defaultPassword}`);
  } finally {
    await dataSource.destroy();
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
