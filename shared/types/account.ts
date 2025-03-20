export type AccountType =
  | "cash"
  | "savings"
  | "credit card"
  | "line of credit"
  | "loan"
  | "insurance";

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: AccountType;
  creditLimit: number | null;
  onHoldAmount: number;
  remainingCreditLimit: number | null;
  statementDate: number | null;
  daysDueAfterStatementDate: number | null;
  annualFee: number | null;
  afWaiverSpendingRequirement: number | null;
  excludeFromBalances: boolean;
}
