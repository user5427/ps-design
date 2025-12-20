import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  showBackground: boolean;
  visibleSections: Record<string, boolean>;
  sidebarPreference: "open" | "closed";
  setShowBackground: (show: boolean) => void;
  setSectionVisibility: (sectionLabel: string, visible: boolean) => void;
  initializeSections: (sections: string[]) => void;
  setSidebarPreference: (preference: "open" | "closed") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      showBackground: true,
      visibleSections: {},
      sidebarPreference: "open",

      setShowBackground: (show: boolean) => set({ showBackground: show }),

      setSectionVisibility: (sectionLabel: string, visible: boolean) =>
        set((state) => ({
          visibleSections: {
            ...state.visibleSections,
            [sectionLabel]: visible,
          },
        })),

      initializeSections: (sections: string[]) => {
        const currentVisible = get().visibleSections;
        const newVisible: Record<string, boolean> = {};

        // Initialize all sections as visible if not already set
        sections.forEach((section) => {
          newVisible[section] =
            currentVisible[section] !== undefined
              ? currentVisible[section]
              : true;
        });

        set({ visibleSections: newVisible });
      },

      setSidebarPreference: (preference: "open" | "closed") =>
        set({ sidebarPreference: preference }),
    }),
    {
      name: "ps-design-settings",
    },
  ),
);
