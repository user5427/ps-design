import AssessmentIcon from "@mui/icons-material/Assessment";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ViewListIcon from "@mui/icons-material/ViewList";
import EventIcon from "@mui/icons-material/Event";
import SecurityIcon from "@mui/icons-material/Security";
import PersonIcon from "@mui/icons-material/Person";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import type { Section } from "@/components/layouts/side-bar/side-bar-item";
import { URLS } from "./urls";

export const sidebarSections: Section[] = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    path: URLS.DASHBOARD,
  },
  {
    label: "Orders",
    icon: <RestaurantIcon />,
    path: URLS.FLOOR_PLAN,
    scope: "ORDERS",
  },
  {
    label: "My Business",
    icon: <BusinessIcon />,
    children: [
      {
        label: "Info",
        icon: <InfoOutlinedIcon />,
        path: URLS.MY_BUSINESS_INFO,
        scope: "BUSINESS",
      },
      {
        label: "Users",
        icon: <PersonIcon />,
        path: URLS.MY_BUSINESS_USERS,
        scope: "USER",
      },
      {
        label: "Roles",
        icon: <SecurityIcon />,
        path: URLS.MY_BUSINESS_ROLES,
        scope: "ROLE",
      },
    ],
  },
  {
    label: "Manage",
    icon: <ManageAccountsIcon />,
    children: [
      {
        label: "Businesses",
        icon: <ViewListIcon />,
        path: URLS.MANAGE_BUSINESSES,
        scope: "SUPERADMIN",
      },
      {
        label: "Users",
        icon: <PersonIcon />,
        path: URLS.MANAGE_USERS,
        scope: "SUPERADMIN",
      },
      {
        label: "Roles",
        icon: <SecurityIcon />,
        path: URLS.MANAGE_ROLES,
        scope: "SUPERADMIN",
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
        scope: "INVENTORY",
      },
      {
        label: "Products",
        icon: <ShoppingCartIcon />,
        path: URLS.INVENTORY_PRODUCTS,
        scope: "INVENTORY",
      },
      {
        label: "Stock Changes",
        icon: <Inventory2Icon />,
        path: URLS.INVENTORY_STOCK,
        scope: "INVENTORY",
      },
      {
        label: "Stock Levels",
        icon: <AssessmentIcon />,
        path: URLS.INVENTORY_STOCK_LEVELS,
        scope: "INVENTORY",
      },
    ],
  },
  {
    label: "Categories",
    icon: <CategoryIcon />,
    path: URLS.CATEGORIES,
    scope: "CATEGORIES",
  },
  {
    label: "Menu",
    icon: <MenuBookIcon />,
    children: [
      {
        label: "Items",
        icon: <RestaurantMenuIcon />,
        path: URLS.MENU_ITEMS,
        scope: "MENU",
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
        scope: "APPOINTMENTS",
      },
      {
        label: "Services",
        icon: <ShoppingCartIcon />,
        path: URLS.APPOINTMENTS_SERVICE_DEFINITIONS,
        scope: "APPOINTMENTS",
      },
      {
        label: "Staff Services",
        icon: <PersonIcon />,
        path: URLS.APPOINTMENTS_STAFF_SERVICES,
        scope: "APPOINTMENTS",
      },
    ],
  },
  {
    label: "Gift Cards",
    icon: <CardGiftcardIcon />,
    path: URLS.GIFT_CARDS,
    scope: "GIFT_CARDS",
  },
  {
    label: "Service Discounts",
    icon: <LocalOfferIcon />,
    path: URLS.DISCOUNTS_SERVICES,
    scope: "SERVICE_DISCOUNTS",
  },
  {
    label: "Menu Discounts ",
    icon: <LocalOfferIcon />,
    path: URLS.DISCOUNTS_MENU,
    scope: "MENU_DISCOUNTS",
  },
  {
    label: "Tax",
    icon: <AssessmentIcon />,
    path: URLS.TAX,
    scope: "TAX",
  },
  {
    label: "Audit Logs",
    icon: <AssessmentIcon />,
    children: [
      {
        label: "Business Logs",
        icon: <BusinessIcon />,
        path: URLS.AUDIT_BUSINESS_LOGS,
        scope: "AUDIT_BUSINESS",
      },
      {
        label: "Security Logs",
        icon: <AssessmentIcon />,
        path: URLS.AUDIT_SECURITY_LOGS,
        scope: "AUDIT_SECURITY",
      },
    ],
  },
  {
    label: "Settings",
    icon: <SettingsIcon />,
    path: URLS.SETTINGS,
  },
];
