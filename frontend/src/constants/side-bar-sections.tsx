import AssessmentIcon from "@mui/icons-material/Assessment";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SettingsIcon from "@mui/icons-material/Settings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ViewListIcon from "@mui/icons-material/ViewList";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import type { Section } from "@/components/layouts/side-bar/side-bar-item";
import { URLS } from "./urls";

export const sidebarSections: Section[] = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    path: URLS.DASHBOARD,
  },
  {
    label: "Manage",
    icon: <BusinessIcon />,
    children: [
      {
        label: "Businesses",
        icon: <ViewListIcon />,
        path: URLS.BUSINESS_LIST,
      },
      {
        label: "Users",
        icon: <PersonIcon />,
        path: URLS.ADMIN_USERS,
      },
    ],
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
    label: "Categories",
    icon: <CategoryIcon />,
    path: URLS.CATEGORIES,
  },
  {
    label: "Menu",
    icon: <MenuBookIcon />,
    children: [
      {
        label: "Items",
        icon: <RestaurantMenuIcon />,
        path: URLS.MENU_ITEMS,
      },
    ],
  },
  {
    label: "Appointments",
    icon: <EventIcon />,
    children: [
      {
        label: "Appointments",
        icon: <EventIcon />,
        path: URLS.APPOINTMENTS_LIST,
      },
      {
        label: "Services",
        icon: <ShoppingCartIcon />,
        path: URLS.APPOINTMENTS_SERVICE_DEFINITIONS,
      },
      {
        label: "Staff Services",
        icon: <PersonIcon />,
        path: URLS.APPOINTMENTS_STAFF_SERVICES,
      },
    ],
  },
  {
    label: "Settings",
    icon: <SettingsIcon />,
    path: "/settings",
  },
];
