import type { Account } from "@/shared/types/account";

const API_BASE = "/api/accounts";

export class AccountsAPI {
  // Get all accounts
  static async getAccounts(): Promise<Account[]> {
    const response = await fetch(API_BASE);

    if (!response.ok) {
      throw new Error("Failed to fetch accounts");
    }

    return response.json();
  }

  // Get a single account by ID
  static async getAccount(id: string): Promise<Account> {
    const response = await fetch(`${API_BASE}/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Account not found");
      }
      throw new Error("Failed to fetch account");
    }

    return response.json();
  }

  // Create a new account
  static async createAccount(
    account: Omit<Account, "id" | "remainingCreditLimit">
  ): Promise<Account> {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(account),
    });

    if (!response.ok) {
      throw new Error("Failed to create account");
    }

    return response.json();
  }

  // Update an existing account
  static async updateAccount(
    id: string,
    account: Partial<Account>
  ): Promise<Account> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(account),
    });

    if (!response.ok) {
      throw new Error("Failed to update account");
    }

    return response.json();
  }

  // Delete an account
  static async deleteAccount(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete account");
    }
  }
}
