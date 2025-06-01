import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { AccountsStore } from "./types";
import { createAccountsActions } from "./actions";

export const useAccountsStore = create<AccountsStore>()(
  persist(
    immer((set, get, store) => ({
      ...createAccountsActions(set, get, store),
    })),
    {
      name: "accounts-storage",
    }
  )
);
