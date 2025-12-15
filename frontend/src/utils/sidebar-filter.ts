import type { Section } from "@/components/layouts/side-bar/side-bar-item";

/**
 * Filters sidebar sections based on user's scopes.
 * Only checks scopes for items that have a path.
 * Shows parent section only if at least one child is visible.
 */
export function filterSectionsByScopes(
  sections: Section[],
  userScopes: string[],
): Section[] {
  return sections
    .map((section) => {
      // If section has a path and scope, check if user has access
      if (section.path && section.scope) {
        if (!userScopes.includes(section.scope)) {
          return null;
        }
        return section;
      }

      // If section has children, filter them
      if (section.children?.length) {
        const filteredChildren = section.children.filter((child) => {
          // Only filter children with paths and scopes
          if (child.path && child.scope) {
            return userScopes.includes(child.scope);
          }
          // Keep children without scope requirements
          return true;
        });

        // Hide parent if no children are visible
        if (filteredChildren.length === 0) {
          return null;
        }

        return { ...section, children: filteredChildren };
      }

      // No path, no children with restrictions - show it
      return section;
    })
    .filter((section): section is Section => section !== null);
}
