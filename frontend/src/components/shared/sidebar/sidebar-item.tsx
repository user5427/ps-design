import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { ListItemButton, ListItemIcon, ListItemText, Collapse, List } from "@mui/material";

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
  onSelect: (label: Section) => void;
  isOpen: boolean;
  onToggle: (label: string) => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ section, isSelected, selected, onSelect, isOpen, onToggle }) => {
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
            {section.children!.map((child) => (
              <ListItemButton
                key={child.label}
                sx={{ pl: 4 }}
                onClick={() => onSelect(child)}
                selected={child.label === selected}
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
}