import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { VisibilityState } from "@tanstack/react-table";

interface SettingsState {
  paymentsTableColumnVisibility: VisibilityState;
  updatePaymentsTableColumnVisibility: (visibility: VisibilityState) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      paymentsTableColumnVisibility: {
        category: false,
        tags: false,
        nextDueDate: false,
      },
      updatePaymentsTableColumnVisibility: (visibility) =>
        set((state) => {
          state.paymentsTableColumnVisibility = visibility;
        }),
    })),
    {
      name: "settings-storage",
    }
  )
);
