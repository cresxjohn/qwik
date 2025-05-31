import { StateCreator } from "zustand";
import { VisibilityState } from "@tanstack/react-table";
import { SettingsStore } from "./types";

export const createSettingsActions: StateCreator<
  SettingsStore,
  [["zustand/immer", never]],
  [],
  SettingsStore
> = (set) => ({
  paymentsTableColumnVisibility: {
    category: false,
    tags: false,
    nextDueDate: false,
  },

  updatePaymentsTableColumnVisibility: (visibility: VisibilityState) =>
    set((state) => {
      state.paymentsTableColumnVisibility = visibility;
    }),
});
