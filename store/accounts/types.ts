import { Account } from "@/shared/types";

export interface AccountsState {
  items: Account[];
  loading: boolean;
  error: string | null;
}

export interface AccountsActions {
  loadAccounts: () => Promise<void>;
  addAccount: (
    accountData: Omit<Account, "id" | "remainingCreditLimit">
  ) => Promise<Account>;
  updateAccount: (account: Account) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  setAccounts: (accounts: Account[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface AccountsStore extends AccountsState, AccountsActions {}
