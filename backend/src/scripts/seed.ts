import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import { $Enums, PrismaClient } from "../generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Configure it in .env");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
    errorFormat: "pretty",
  });

  try {
    // Create or reuse a default business
    const businessName = "Default Business";
    let business = await prisma.business.findFirst({
      where: { name: businessName },
    });
    if (!business) {
      business = await prisma.business.create({ data: { name: businessName } });
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
      role: $Enums.Role;
      businessId?: string | null;
      isPasswordResetRequired?: boolean;
    }> = [
      {
        email: "superadmin@demo.local",
        name: "SupAdminas",
        role: $Enums.Role.SUPER_ADMIN,
        businessId: null,
        isPasswordResetRequired: true,
      },
      {
        email: "admin@demo.local",
        name: "AdminasUseris",
        role: $Enums.Role.ADMIN,
        businessId: business.id,
        isPasswordResetRequired: true,
      },
      {
        email: "user@demo.local",
        name: "Johnny",
        role: $Enums.Role.USER,
        businessId: business.id,
        isPasswordResetRequired: true,
      },
    ];

    for (const u of users) {
      const created = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          name: u.name,
          role: u.role,
          passwordHash,
          isPasswordResetRequired: u.isPasswordResetRequired ?? true,
          businessId: u.businessId ?? undefined,
        },
      });
      console.log(`Ensured user: ${created.email} (${created.role})`);
    }

    console.log("Seed complete. You can login with the default password.");
    console.log(`Default password: ${defaultPassword}`);
  } finally {
    // Ensure the process exits after disconnect
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});
