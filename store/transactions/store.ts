import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { mockTransactions } from "@/shared/mock";
import { TransactionsStore } from "./types";
import { createTransactionsActions } from "./actions";

export const useTransactionsStore = create<TransactionsStore>()(
  persist(
    immer((set, get, store) => ({
      ...createTransactionsActions(set, get, store),
      // Override initial state with mock data
      items: mockTransactions,
    })),
    {
      name: "transactions-storage",
    }
  )
);
