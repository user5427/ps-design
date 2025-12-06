import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TimelineIcon from "@mui/icons-material/Timeline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import type { Section } from "@/components/shared/sidebar/sidebar-item";
import { URLS } from "./urls";

export const sidebarSections: Section[] = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    path: URLS.DASHBOARD,
  },
  {
    label: "Inventory",
    icon: <Inventory2Icon />,
    children: [
      {
        label: "Product Units",
        icon: <CategoryIcon />,
        path: "/inventory/units",
      },
      {
        label: "Products",
        icon: <ShoppingCartIcon />,
        path: "/inventory/products",
      },
      {
        label: "Stock Levels",
        icon: <Inventory2Icon />,
        path: "/inventory/stock",
      },
    ],
  },
  {
    label: "Analytics",
    icon: <InsightsIcon />,
    children: [
      { label: "Sales", icon: <TrendingUpIcon />, path: "/analytics/sales" },
      { label: "Traffic", icon: <TimelineIcon />, path: "/analytics/traffic" },
    ],
  },
  {
    label: "Settings",
    icon: <SettingsIcon />,
    path: "/settings",
  },
];
