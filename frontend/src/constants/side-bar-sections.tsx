import AssessmentIcon from "@mui/icons-material/Assessment";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
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
import type { Section } from "@/components/layouts/side-bar/side-bar-item";
import { URLS } from "./urls";

export const sidebarSections: Section[] = [
  {
    label: "Dashboard",
    icon: <DashboardIcon />,
    path: URLS.DASHBOARD,
  },
  // ORDERS
  {
    label: "Orders",
    icon: <RestaurantIcon />,
    path: URLS.FLOOR_PLAN,
  },
  // ROLES AND USERS
  {
    label: "My Business",
    icon: <BusinessIcon />,
    children: [
      {
        label: "Roles",
        icon: <SecurityIcon />,
        path: "/my-business/roles",
      },
    ],
  },
  // SUPERADMIN ONLY
  {
    label: "Manage",
    icon: <BusinessIcon />,
    children: [
      {
        label: "Businesses",
        icon: <ViewListIcon />,
        path: URLS.MANAGE_BUSINESSES,
      },
      {
        label: "Users",
        icon: <PersonIcon />,
        path: URLS.MANAGE_USERS,
      },
      {
        label: "Roles",
        icon: <SecurityIcon />,
        path: URLS.MANAGE_ROLES,
      },
    ],
  },
  // INVENTORY
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
  // CATEGORIES
  {
    label: "Categories",
    icon: <CategoryIcon />,
    path: URLS.CATEGORIES,
  },
  // MENU
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
  // APPOINTMENTS
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
  // GIFT CARDS
  {
    label: "Gift Cards",
    icon: <CardGiftcardIcon />,
    path: URLS.GIFT_CARDS,
  },
  // DISCOUNTS
  {
    label: "Discounts",
    icon: <LocalOfferIcon />,
    path: URLS.DISCOUNTS,
  },
  // TAX
  {
    label: "Tax",
    icon: <AssessmentIcon />,
    path: URLS.TAX,
  },
  {
    label: "Audit Logs",
    icon: <AssessmentIcon />,
    children: [
      // AUDIT BUSINESS
      {
        label: "Business Logs",
        icon: <BusinessIcon />,
        path: URLS.AUDIT_BUSINESS_LOGS,
      },
      // AUDIT SECURITY
      {
        label: "Security Logs",
        icon: <AssessmentIcon />,
        path: URLS.AUDIT_SECURITY_LOGS,
      },
    ],
  },
];
