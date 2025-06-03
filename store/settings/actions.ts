import { StateCreator } from "zustand";
import { VisibilityState } from "@tanstack/react-table";
import { SettingsStore } from "./types";

export const createSettingsActions: StateCreator<
  SettingsStore,
  [["zustand/immer", never]],
  [],
  SettingsStore
> = (set) => ({
  paymentsTableColumnVisibility: {
    category: false,
    tags: false,
    nextDueDate: false,
  },

  accountsTableColumnVisibility: {
    // Essential columns visible by default
    name: true,
    type: true,
    balance: true,
    bankInstitution: true,
    accountNumber: true,

    // Interest fields - hidden by default
    interestRate: false,
    interestFrequency: false,

    // Credit card/line of credit fields - hidden by default
    creditLimit: false,
    remainingCreditLimit: false,
    onHoldAmount: false,
    statementDate: false,
    daysDueAfterStatementDate: false,
    annualFee: false,
    afWaiverSpendingRequirement: false,

    // Loan specific fields - hidden by default
    originalLoanAmount: false,
    monthlyPaymentAmount: false,
    loanType: false,
    loanStartDate: false,
    maturityDate: false,
    loanTermMonths: false,

    // Insurance specific fields - hidden by default
    policyType: false,
    premiumAmount: false,
    premiumFrequency: false,
    coverageAmount: false,
    policyStartDate: false,
    policyEndDate: false,

    // Optional fields - hidden by default
    minimumBalance: false,
    monthlyMaintenanceFee: false,
    excludeFromBalances: false,
  },

  updatePaymentsTableColumnVisibility: (visibility: VisibilityState) =>
    set((state) => {
      state.paymentsTableColumnVisibility = visibility;
    }),

  updateAccountsTableColumnVisibility: (visibility: VisibilityState) =>
    set((state) => {
      state.accountsTableColumnVisibility = visibility;
    }),
});
