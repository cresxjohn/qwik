import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { mockTransactions } from "@/shared/mock";
import { Transaction } from "@/shared/types";

interface TransactionsState {
  items: Transaction[];
  loading: boolean;
  error: string | null;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    immer((set) => ({
      items: mockTransactions,
      loading: false,
      error: null,
      addTransaction: (transaction) =>
        set((state) => {
          state.items.push(transaction);
        }),
      updateTransaction: (transaction) =>
        set((state) => {
          const index = state.items.findIndex((t) => t.id === transaction.id);
          if (index !== -1) {
            state.items[index] = transaction;
          }
        }),
      deleteTransaction: (id) =>
        set((state) => {
          state.items = state.items.filter((t) => t.id !== id);
        }),
      setTransactions: (transactions) =>
        set((state) => {
          state.items = transactions;
        }),
      setLoading: (loading) =>
        set((state) => {
          state.loading = loading;
        }),
      setError: (error) =>
        set((state) => {
          state.error = error;
        }),
    })),
    {
      name: "transactions-storage",
    }
  )
);
