import { List } from "@mui/material";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import React from "react";
import { type Section, SidebarItem } from "./side-bar-item";

interface SidebarContentProps {
  sections: Section[];
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ sections }) => {
  const navigate = useNavigate();
  const location = useRouterState().location.pathname;

  // Derive selected based on current URL
  const selected = React.useMemo(() => {
    for (const section of sections) {
      if (section.path === location) return section.label;
      if (section.children) {
        const matchingChild = section.children.find((c) => c.path === location);
        if (matchingChild) return matchingChild.label;
      }
    }
    return "";
  }, [sections, location]);

  const [open, setOpen] = React.useState<Record<string, boolean>>(() => {
    return sections.reduce(
      (acc, section) => {
        const containsSelected = section.children?.some(
          (child) => child.label === selected,
        );
        acc[section.label] = containsSelected || false;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  });

  const toggle = (label: string) => {
    setOpen((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleSelect = (section: Section) => {
    if (section.path) {
      navigate({ to: section.path });
    }
  };

  return (
    <List component="nav" aria-label="Navigation menu">
      {sections.map((section) => (
        <SidebarItem
          key={section.label}
          section={section}
          isSelected={
            section.label === selected ||
            section.children?.some((c) => c.label === selected) ||
            false
          }
          selected={selected}
          onSelect={handleSelect}
          isOpen={open[section.label]}
          onToggle={toggle}
        />
      ))}
    </List>
  );
};
