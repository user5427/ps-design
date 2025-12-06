import type { MenuProps } from "@/components/layouts";

export const MenuData: MenuProps = {
  categories: [
    {
      category: "Main",
      links: [
        { label: "Home", to: "/" },
        { label: "Dashboard", to: "/dashboard" },
        { label: "Orders", to: "/orders" },
      ],
    },
    {
      category: "Account",
      links: [
        { label: "Profile", to: "/profile" },
        { label: "Settings", to: "/settings" },
        { label: "Sign out", to: "/logout" },
      ],
    },
  ],
};
