import AssessmentIcon from "@mui/icons-material/Assessment";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TimelineIcon from "@mui/icons-material/Timeline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import type { Section } from "@/components/layouts/side-bar/side-bar-item";
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
        path: URLS.INVENTORY_UNITS,
      },
      {
        label: "Products",
        icon: <ShoppingCartIcon />,
        path: URLS.INVENTORY_PRODUCTS,
      },
      {
        label: "Stock Changes",
        icon: <Inventory2Icon />,
        path: URLS.INVENTORY_STOCK,
      },
      {
        label: "Stock Levels",
        icon: <AssessmentIcon />,
        path: URLS.INVENTORY_STOCK_LEVELS,
      },
    ],
  },
  {
    label: "Menu",
    icon: <MenuBookIcon />,
    children: [
      {
        label: "Categories",
        icon: <CategoryIcon />,
        path: URLS.MENU_CATEGORIES,
      },
      {
        label: "Menu Items",
        icon: <RestaurantMenuIcon />,
        path: URLS.MENU_ITEMS,
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
