import { StateCreator } from "zustand";
import { Transaction } from "@/shared/types";
import { TransactionsStore } from "./types";

export const createTransactionsActions: StateCreator<
  TransactionsStore,
  [["zustand/immer", never]],
  [],
  TransactionsStore
> = (set) => ({
  items: [],
  loading: false,
  error: null,

  addTransaction: (transaction: Transaction) =>
    set((state) => {
      state.items.push(transaction);
    }),

  updateTransaction: (transaction: Transaction) =>
    set((state) => {
      const index = state.items.findIndex((t) => t.id === transaction.id);
      if (index !== -1) {
        state.items[index] = transaction;
      }
    }),

  deleteTransaction: (id: string) =>
    set((state) => {
      state.items = state.items.filter((t) => t.id !== id);
    }),

  setTransactions: (transactions: Transaction[]) =>
    set((state) => {
      state.items = transactions;
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
