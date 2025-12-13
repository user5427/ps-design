import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useRouterState } from "@tanstack/react-router";

type ChildSection = {
  label: string;
  icon: React.ReactNode;
  path?: string;
};

export type Section = {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: ChildSection[];
};

interface SidebarItemProps {
  section: Section;
  isSelected: boolean;
  selected: string;
  onSelect: (section: Section) => void;
  isOpen: boolean;
  onToggle: (label: string) => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  section,
  isSelected,
  onSelect,
  isOpen,
  onToggle,
}) => {
  const location = useRouterState().location.pathname;
  const hasChildren = !!section.children && section.children.length > 0;

  const handleParentClick = () => {
    if (hasChildren) {
      onToggle(section.label);
    } else {
      onSelect(section);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleParentClick}
        selected={isSelected && !hasChildren}
      >
        <ListItemIcon>{section.icon}</ListItemIcon>
        <ListItemText primary={section.label} />
        {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>
      {hasChildren && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {section.children?.map((child) => (
              <ListItemButton
                key={child.path || child.label}
                sx={{ pl: 4 }}
                onClick={() => onSelect(child)}
                selected={child.path === location}
              >
                <ListItemIcon>{child.icon}</ListItemIcon>
                <ListItemText primary={child.label} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};
