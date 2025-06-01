import { Account } from "@/shared/types";

export interface AccountsState {
  items: Account[];
  loading: boolean;
  error: string | null;
}

export interface AccountsActions {
  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  setAccounts: (accounts: Account[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface AccountsStore extends AccountsState, AccountsActions {}
