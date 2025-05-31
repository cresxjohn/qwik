import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { SettingsStore } from "./types";
import { createSettingsActions } from "./actions";

export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set, get, store) => ({
      ...createSettingsActions(set, get, store),
    })),
    {
      name: "settings-storage",
    }
  )
);
