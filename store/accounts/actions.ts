import { StateCreator } from "zustand";
import { Account } from "@/shared/types";
import { AccountsStore } from "./types";
import { mockAccounts } from "@/shared/mock";

export const createAccountsActions: StateCreator<
  AccountsStore,
  [["zustand/immer", never]],
  [],
  AccountsStore
> = (set) => ({
  items: mockAccounts,
  loading: false,
  error: null,

  addAccount: (account: Account) =>
    set((state) => {
      state.items.push(account);
    }),

  updateAccount: (account: Account) =>
    set((state) => {
      const index = state.items.findIndex((a) => a.id === account.id);
      if (index !== -1) {
        state.items[index] = account;
      }
    }),

  deleteAccount: (id: string) =>
    set((state) => {
      state.items = state.items.filter((a) => a.id !== id);
    }),

  setAccounts: (accounts: Account[]) =>
    set((state) => {
      state.items = accounts;
    }),

  setLoading: (loading: boolean) =>
    set((state) => {
      state.loading = loading;
    }),

  setError: (error: string | null) =>
    set((state) => {
      state.error = error;
    }),
});
