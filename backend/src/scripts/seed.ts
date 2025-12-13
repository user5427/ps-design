import "dotenv/config";
import * as bcrypt from "bcryptjs";
import { createDataSource } from "@/database/data-source";
import { Business } from "@/modules/business";
import { User, Role, ScopeEntity, UserRole, RoleScope } from "@/modules/user";
import { ScopeNames, SCOPE_CONFIG } from "@/modules/user/scope.types";

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

    // Seed Roles - All roles are business-based
    const roleConfigs: Array<{
      name: string;
      businessId: string;
      isSystemRole: boolean;
      isDeletable: boolean;
    }> = [
      {
        name: "SUPERADMIN",
        businessId: business.id,
        isSystemRole: true,
        isDeletable: false,
      },
      {
        name: "OWNER",
        businessId: business.id,
        isSystemRole: true,
        isDeletable: false,
      },
      {
        name: "USER",
        businessId: business.id,
        isSystemRole: false,
        isDeletable: true,
      },
    ];

    const roles = new Map<string, Role>();

    for (const config of roleConfigs) {
      let role = await roleRepo.findOne({
        where: { name: config.name, businessId: config.businessId },
      });
      if (!role) {
        role = roleRepo.create({
          name: config.name,
          description: `${config.name} role with appropriate permissions`,
          businessId: config.businessId,
          isSystemRole: config.isSystemRole,
          isDeletable: config.isDeletable,
        });
        role = await roleRepo.save(role);
        console.log(
          `Created role: ${role.name} for business ${config.businessId}`,
        );
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
      roles.set(config.name, role);
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
        roleName: "SUPERADMIN",
        scopes: [
          ScopeNames.SUPERADMIN,
          ScopeNames.OWNER,
          ScopeNames.INVENTORY_READ,
          ScopeNames.INVENTORY_WRITE,
          ScopeNames.INVENTORY_DELETE,
          ScopeNames.MENU_READ,
          ScopeNames.MENU_WRITE,
          ScopeNames.MENU_DELETE,
          ScopeNames.USER_READ,
          ScopeNames.USER_WRITE,
          ScopeNames.USER_DELETE,
          ScopeNames.ROLE_READ,
          ScopeNames.ROLE_WRITE,
          ScopeNames.ROLE_DELETE,
          ScopeNames.BUSINESS_READ,
          ScopeNames.BUSINESS_WRITE,
          ScopeNames.BUSINESS_DELETE,
          ScopeNames.BUSINESS_CREATE,
          ScopeNames.APPOINTMENTS_READ,
          ScopeNames.APPOINTMENTS_WRITE,
          ScopeNames.APPOINTMENTS_DELETE,
          ScopeNames.GIFT_CARDS_READ,
          ScopeNames.GIFT_CARDS_WRITE,
          ScopeNames.GIFT_CARDS_DELETE,
        ],
      },
      {
        roleName: "OWNER",
        scopes: [
          ScopeNames.OWNER,
          ScopeNames.USER_READ,
          ScopeNames.USER_WRITE,
          ScopeNames.USER_DELETE,
          ScopeNames.ROLE_READ,
          ScopeNames.ROLE_WRITE,
          ScopeNames.ROLE_DELETE,
          ScopeNames.INVENTORY_READ,
          ScopeNames.INVENTORY_WRITE,
          ScopeNames.INVENTORY_DELETE,
          ScopeNames.MENU_READ,
          ScopeNames.MENU_WRITE,
          ScopeNames.MENU_DELETE,
          ScopeNames.BUSINESS_READ,
          ScopeNames.BUSINESS_WRITE,
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
        name: "Super Administrator",
        roleNames: ["SUPERADMIN"],
        businessId: business.id,
        isPasswordResetRequired: true,
      },
      {
        email: "owner@demo.local",
        name: "Business Owner",
        roleNames: ["OWNER"],
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
