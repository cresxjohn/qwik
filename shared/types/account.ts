export type AccountType =
  | "cash"
  | "savings"
  | "credit card"
  | "line of credit"
  | "loan"
  | "insurance";

export type LoanType =
  | "mortgage"
  | "auto"
  | "personal"
  | "student"
  | "business"
  | "other";

export type InsurancePolicyType =
  | "life"
  | "health"
  | "auto"
  | "home"
  | "renters"
  | "disability"
  | "other";

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: AccountType;

  // Credit-related fields (Credit Card, Line of Credit)
  creditLimit: number | null;
  onHoldAmount: number;
  remainingCreditLimit: number | null;

  // Credit Card specific fields
  statementDate: number | null;
  daysDueAfterStatementDate: number | null;
  annualFee: number | null;
  afWaiverSpendingRequirement: number | null;

  // Interest fields (Savings, Credit Card, Line of Credit, Loan)
  interestRate: number | null;
  interestFrequency: string | null;

  // Loan specific fields
  originalLoanAmount: number | null;
  monthlyPaymentAmount: number | null;
  loanStartDate: string | null;
  maturityDate: string | null;
  loanTermMonths: number | null;
  loanType: LoanType | null;

  // Insurance specific fields
  policyType: InsurancePolicyType | null;
  premiumAmount: number | null;
  premiumFrequency: string | null;
  coverageAmount: number | null;
  policyStartDate: string | null;
  policyEndDate: string | null;

  // Optional fields for all types
  bankInstitution: string | null;
  accountNumber: string | null;
  minimumBalance: number | null;
  monthlyMaintenanceFee: number | null;

  // System fields
  excludeFromBalances: boolean;
}
