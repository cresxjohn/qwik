import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createTransactionsActions } from "./actions";
import { TransactionsStore } from "./types";

export const useTransactionsStore = create<TransactionsStore>()(
  persist(
    immer((set, get, store) => ({
      ...createTransactionsActions(set, get, store),
    })),
    {
      name: "transactions-storage",
    }
  )
);
