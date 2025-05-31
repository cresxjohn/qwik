import { Transaction } from "@/shared/types";

export interface TransactionsState {
  items: Transaction[];
  loading: boolean;
  error: string | null;
}

export interface TransactionsActions {
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface TransactionsStore
  extends TransactionsState,
    TransactionsActions {}
