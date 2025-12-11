import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { createDataSource } from "@/database/data-source";
import { Business } from "@/modules/business";
import { User, Role, ScopeEntity, UserRole, RoleScope } from "@/modules/user";
import { ScopeNames, SCOPE_CONFIG } from "@/modules/user/scope.types";
import {
  DiningTable,
  DiningTableStatus,
  Order,
  OrderStatus,
} from "@/modules/order";

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
  const roleRepo = dataSource.getRepository(Role);
  const scopeRepo = dataSource.getRepository(ScopeEntity);
  const userRoleRepo = dataSource.getRepository(UserRole);
  const roleScopeRepo = dataSource.getRepository(RoleScope);
  const tableRepo = dataSource.getRepository(DiningTable);
  const orderRepo = dataSource.getRepository(Order);

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
    const defaultPassword = "Geras@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Seed Roles
    const roleNames = ["SUPER_ADMIN", "ADMIN", "USER"];
    const roles = new Map<string, Role>();

    for (const roleName of roleNames) {
      let role = await roleRepo.findOne({ where: { name: roleName } });
      if (!role) {
        role = roleRepo.create({
          name: roleName,
          description: `${roleName} role with appropriate permissions`,
        });
        role = await roleRepo.save(role);
        console.log(`Created role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
      roles.set(roleName, role);
    }

    // Seed Scopes
    const scopeNames = Object.values(ScopeNames);
    const scopes = new Map<string, ScopeEntity>();

    for (const scopeName of scopeNames) {
      let scope = await scopeRepo.findOne({ where: { name: scopeName } });
      if (!scope) {
        const config = SCOPE_CONFIG[scopeName];
        scope = scopeRepo.create({
          name: scopeName,
          description: config.description,
        });
        scope = await scopeRepo.save(scope);
        console.log(`Created scope: ${scope.name}`);
      } else {
        console.log(`Scope already exists: ${scope.name}`);
      }
      scopes.set(scopeName, scope);
    }

    // Seed RoleScope mappings (which scopes each role has)
    const roleScopeMappings: Array<{
      roleName: string;
      scopes: string[];
    }> = [
      {
        roleName: "SUPER_ADMIN",
        scopes: Object.values(ScopeNames), // All scopes
      },
      {
        roleName: "ADMIN",
        scopes: [
          ScopeNames.INVENTORY_READ,
          ScopeNames.INVENTORY_WRITE,
          ScopeNames.USER_READ,
          ScopeNames.USER_WRITE,
          ScopeNames.BUSINESS_READ,
          ScopeNames.MENU_DELETE,
          ScopeNames.MENU_READ,
          ScopeNames.MENU_WRITE,
        ],
      },
      {
        roleName: "USER",
        scopes: [ScopeNames.INVENTORY_READ],
      },
    ];

    for (const mapping of roleScopeMappings) {
      const role = roles.get(mapping.roleName);
      if (!role) continue;

      for (const scopeName of mapping.scopes) {
        const scope = scopes.get(scopeName);
        if (!scope) continue;

        const existing = await roleScopeRepo.findOne({
          where: { roleId: role.id, scopeId: scope.id },
        });
        if (!existing) {
          const roleScope = roleScopeRepo.create({
            roleId: role.id,
            scopeId: scope.id,
          });
          await roleScopeRepo.save(roleScope);
          console.log(`Created RoleScope: ${role.name} -> ${scope.name}`);
        }
      }
    }

    // Seed Users
    const users: Array<{
      email: string;
      name: string;
      roleNames: string[];
      businessId?: string | null;
      isPasswordResetRequired?: boolean;
    }> = [
      {
        email: "superadmin@demo.local",
        name: "SupAdminas",
        roleNames: ["SUPER_ADMIN"],
        businessId: null,
        isPasswordResetRequired: true,
      },
      {
        email: "admin@demo.local",
        name: "AdminasUseris",
        roleNames: ["ADMIN"],
        businessId: business.id,
        isPasswordResetRequired: true,
      },
      {
        email: "user@demo.local",
        name: "Johnny",
        roleNames: ["USER"],
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
          passwordHash,
          isPasswordResetRequired: u.isPasswordResetRequired ?? true,
          businessId: u.businessId ?? undefined,
        });
        existing = await userRepo.save(existing);
        console.log(`Created user: ${existing.email}`);

        // Assign roles to user
        for (const roleName of u.roleNames) {
          const role = roles.get(roleName);
          if (role) {
            const userRole = userRoleRepo.create({
              userId: existing.id,
              roleId: role.id,
            });
            await userRoleRepo.save(userRole);
            console.log(
              `  Assigned role ${roleName} to user ${existing.email}`,
            );
          }
        }
      } else {
        console.log(`User already exists: ${existing.email}`);
      }
    }

    // Seed a few dining tables for the default business
    const existingTables = await tableRepo.find({
      where: { businessId: business.id },
    });

    if (existingTables.length === 0) {
      const tablesToCreate: Array<Partial<DiningTable>> = [
        { label: "1A", capacity: 2, status: DiningTableStatus.AVAILABLE },
        { label: "2A", capacity: 4, status: DiningTableStatus.ACTIVE },
        { label: "3A", capacity: 4, status: DiningTableStatus.ATTENTION },
        { label: "1B", capacity: 2, status: DiningTableStatus.AVAILABLE },
        {
          label: "2B",
          capacity: 4,
          status: DiningTableStatus.AVAILABLE,
          reserved: true,
        },
        { label: "3B", capacity: 6, status: DiningTableStatus.ACTIVE },
      ];

      const createdTables: DiningTable[] = [];

      for (const t of tablesToCreate) {
        const table = tableRepo.create({
          businessId: business.id,
          label: t.label!,
          capacity: t.capacity!,
          status: t.status!,
          reserved: t.reserved ?? false,
        });
        createdTables.push(await tableRepo.save(table));
        console.log(`Created table: ${table.label} (${table.capacity} seats)`);
      }

      // Seed a couple of open orders for ACTIVE/ATTENTION tables
      const [table2A, table3A, table3B] = [
        createdTables.find((t) => t.label === "2A"),
        createdTables.find((t) => t.label === "3A"),
        createdTables.find((t) => t.label === "3B"),
      ];

      const employeeUser = await userRepo.findOne({
        where: { email: "user@demo.local" },
      });

      const baseTotals = {
        itemsTotal: 25,
        totalTax: 5,
        totalTip: 0,
        totalDiscount: 0,
      };

      const tablesForOrders = [table2A, table3A, table3B].filter(
        (t): t is DiningTable => !!t,
      );

      for (const t of tablesForOrders) {
        const existingOrder = await orderRepo.findOne({
          where: { tableId: t.id, status: OrderStatus.OPEN },
        });

        if (!existingOrder) {
          const order = orderRepo.create({
            businessId: business.id,
            tableId: t.id,
            status: OrderStatus.OPEN,
            ...baseTotals,
            totalAmount:
              baseTotals.itemsTotal +
              baseTotals.totalTax +
              baseTotals.totalTip -
              baseTotals.totalDiscount,
          });
          const savedOrder = await orderRepo.save(order);
          console.log(
            `Created open order ${savedOrder.id} for table ${t.label}`,
          );
        }
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
