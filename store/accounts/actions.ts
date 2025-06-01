import { StateCreator } from "zustand";
import { Account } from "@/shared/types";
import { AccountsStore } from "./types";
import { AccountsAPI } from "@/lib/api/accounts";

export const createAccountsActions: StateCreator<
  AccountsStore,
  [["zustand/immer", never]],
  [],
  AccountsStore
> = (set) => ({
  items: [],
  loading: false,
  error: null,

  // Load accounts from API
  loadAccounts: async () => {
    set((state) => {
      state.loading = true;
      state.error = null;
    });

    try {
      const accounts = await AccountsAPI.getAccounts();
      set((state) => {
        state.items = accounts;
        state.loading = false;
      });
    } catch (error) {
      set((state) => {
        state.error =
          error instanceof Error ? error.message : "Failed to load accounts";
        state.loading = false;
      });
    }
  },

  addAccount: async (
    accountData: Omit<Account, "id" | "remainingCreditLimit">
  ) => {
    set((state) => {
      state.loading = true;
      state.error = null;
    });

    try {
      const account = await AccountsAPI.createAccount(accountData);
      set((state) => {
        state.items.push(account);
        state.loading = false;
      });
      return account;
    } catch (error) {
      set((state) => {
        state.error =
          error instanceof Error ? error.message : "Failed to create account";
        state.loading = false;
      });
      throw error;
    }
  },

  updateAccount: async (account: Account) => {
    set((state) => {
      state.loading = true;
      state.error = null;
    });

    try {
      const updatedAccount = await AccountsAPI.updateAccount(
        account.id,
        account
      );
      set((state) => {
        const index = state.items.findIndex((a) => a.id === account.id);
        if (index !== -1) {
          state.items[index] = updatedAccount;
        }
        state.loading = false;
      });
      return updatedAccount;
    } catch (error) {
      set((state) => {
        state.error =
          error instanceof Error ? error.message : "Failed to update account";
        state.loading = false;
      });
      throw error;
    }
  },

  deleteAccount: async (id: string) => {
    set((state) => {
      state.loading = true;
      state.error = null;
    });

    try {
      await AccountsAPI.deleteAccount(id);
      set((state) => {
        state.items = state.items.filter((a) => a.id !== id);
        state.loading = false;
      });
    } catch (error) {
      set((state) => {
        state.error =
          error instanceof Error ? error.message : "Failed to delete account";
        state.loading = false;
      });
      throw error;
    }
  },

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
