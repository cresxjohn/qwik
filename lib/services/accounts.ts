import { supabaseAdmin } from "@/lib/supabase-server";
import type { Account } from "@/shared/types/account";
import type { Database } from "@/shared/types/database";

type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];

// Convert database row to frontend Account type
export function dbAccountToAccount(dbAccount: AccountRow): Account {
  return {
    id: dbAccount.id,
    name: dbAccount.name,
    balance: dbAccount.balance,
    type: dbAccount.type,
    creditLimit: dbAccount.credit_limit,
    onHoldAmount: dbAccount.on_hold_amount,
    remainingCreditLimit: dbAccount.remaining_credit_limit,
    statementDate: dbAccount.statement_date,
    daysDueAfterStatementDate: dbAccount.days_due_after_statement_date,
    annualFee: dbAccount.annual_fee,
    afWaiverSpendingRequirement: dbAccount.af_waiver_spending_requirement,
    excludeFromBalances: dbAccount.exclude_from_balances,
    interestRate: dbAccount.interest_rate,
    interestFrequency: dbAccount.interest_frequency,
    // Loan specific fields
    originalLoanAmount: dbAccount.original_loan_amount,
    monthlyPaymentAmount: dbAccount.monthly_payment_amount,
    loanStartDate: dbAccount.loan_start_date,
    maturityDate: dbAccount.maturity_date,
    loanTermMonths: dbAccount.loan_term_months,
    loanType: dbAccount.loan_type,
    // Insurance specific fields
    policyType: dbAccount.policy_type,
    premiumAmount: dbAccount.premium_amount,
    premiumFrequency: dbAccount.premium_frequency,
    coverageAmount: dbAccount.coverage_amount,
    policyStartDate: dbAccount.policy_start_date,
    policyEndDate: dbAccount.policy_end_date,
    // Optional fields for all types
    bankInstitution: dbAccount.bank_institution,
    accountNumber: dbAccount.account_number,
    minimumBalance: dbAccount.minimum_balance,
    monthlyMaintenanceFee: dbAccount.monthly_maintenance_fee,
  };
}

// Convert frontend Account type to database insert
export function accountToDbInsert(
  account: Account,
  userId: string
): AccountInsert {
  return {
    id: account.id,
    name: account.name,
    balance: account.balance,
    type: account.type,
    credit_limit: account.creditLimit,
    on_hold_amount: account.onHoldAmount,
    remaining_credit_limit: account.remainingCreditLimit,
    statement_date: account.statementDate,
    days_due_after_statement_date: account.daysDueAfterStatementDate,
    annual_fee: account.annualFee,
    af_waiver_spending_requirement: account.afWaiverSpendingRequirement,
    exclude_from_balances: account.excludeFromBalances,
    interest_rate: account.interestRate,
    interest_frequency: account.interestFrequency,
    // Loan specific fields
    original_loan_amount: account.originalLoanAmount,
    monthly_payment_amount: account.monthlyPaymentAmount,
    loan_start_date: account.loanStartDate,
    maturity_date: account.maturityDate,
    loan_term_months: account.loanTermMonths,
    loan_type: account.loanType,
    // Insurance specific fields
    policy_type: account.policyType,
    premium_amount: account.premiumAmount,
    premium_frequency: account.premiumFrequency,
    coverage_amount: account.coverageAmount,
    policy_start_date: account.policyStartDate,
    policy_end_date: account.policyEndDate,
    // Optional fields for all types
    bank_institution: account.bankInstitution,
    account_number: account.accountNumber,
    minimum_balance: account.minimumBalance,
    monthly_maintenance_fee: account.monthlyMaintenanceFee,
    user_id: userId,
  };
}

// Convert frontend Account type to database update
export function accountToDbUpdate(account: Partial<Account>): AccountUpdate {
  const update: AccountUpdate = {};

  if (account.name !== undefined) update.name = account.name;
  if (account.balance !== undefined) update.balance = account.balance;
  if (account.type !== undefined) update.type = account.type;
  if (account.creditLimit !== undefined)
    update.credit_limit = account.creditLimit;
  if (account.onHoldAmount !== undefined)
    update.on_hold_amount = account.onHoldAmount;
  if (account.remainingCreditLimit !== undefined)
    update.remaining_credit_limit = account.remainingCreditLimit;
  if (account.statementDate !== undefined)
    update.statement_date = account.statementDate;
  if (account.daysDueAfterStatementDate !== undefined)
    update.days_due_after_statement_date = account.daysDueAfterStatementDate;
  if (account.annualFee !== undefined) update.annual_fee = account.annualFee;
  if (account.afWaiverSpendingRequirement !== undefined)
    update.af_waiver_spending_requirement = account.afWaiverSpendingRequirement;
  if (account.excludeFromBalances !== undefined)
    update.exclude_from_balances = account.excludeFromBalances;
  if (account.interestRate !== undefined)
    update.interest_rate = account.interestRate;
  if (account.interestFrequency !== undefined)
    update.interest_frequency = account.interestFrequency;

  // Loan specific fields
  if (account.originalLoanAmount !== undefined)
    update.original_loan_amount = account.originalLoanAmount;
  if (account.monthlyPaymentAmount !== undefined)
    update.monthly_payment_amount = account.monthlyPaymentAmount;
  if (account.loanStartDate !== undefined)
    update.loan_start_date = account.loanStartDate;
  if (account.maturityDate !== undefined)
    update.maturity_date = account.maturityDate;
  if (account.loanTermMonths !== undefined)
    update.loan_term_months = account.loanTermMonths;
  if (account.loanType !== undefined) update.loan_type = account.loanType;

  // Insurance specific fields
  if (account.policyType !== undefined) update.policy_type = account.policyType;
  if (account.premiumAmount !== undefined)
    update.premium_amount = account.premiumAmount;
  if (account.premiumFrequency !== undefined)
    update.premium_frequency = account.premiumFrequency;
  if (account.coverageAmount !== undefined)
    update.coverage_amount = account.coverageAmount;
  if (account.policyStartDate !== undefined)
    update.policy_start_date = account.policyStartDate;
  if (account.policyEndDate !== undefined)
    update.policy_end_date = account.policyEndDate;

  // Optional fields for all types
  if (account.bankInstitution !== undefined)
    update.bank_institution = account.bankInstitution;
  if (account.accountNumber !== undefined)
    update.account_number = account.accountNumber;
  if (account.minimumBalance !== undefined)
    update.minimum_balance = account.minimumBalance;
  if (account.monthlyMaintenanceFee !== undefined)
    update.monthly_maintenance_fee = account.monthlyMaintenanceFee;

  update.updated_at = new Date().toISOString();

  return update;
}

export class AccountsService {
  // Get all accounts for a user
  static async getAccounts(userId: string): Promise<Account[]> {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return data.map(dbAccountToAccount);
  }

  // Get a single account by ID
  static async getAccount(id: string, userId: string): Promise<Account | null> {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    return dbAccountToAccount(data);
  }

  // Create a new account
  static async createAccount(
    account: Account,
    userId: string
  ): Promise<Account> {
    const dbAccount = accountToDbInsert(account, userId);

    const { data, error } = await supabaseAdmin
      .from("accounts")
      .insert(dbAccount)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }

    return dbAccountToAccount(data);
  }

  // Update an existing account
  static async updateAccount(
    id: string,
    account: Partial<Account>,
    userId: string
  ): Promise<Account> {
    const dbUpdate = accountToDbUpdate(account);

    const { data, error } = await supabaseAdmin
      .from("accounts")
      .update(dbUpdate)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update account: ${error.message}`);
    }

    return dbAccountToAccount(data);
  }

  // Delete an account
  static async deleteAccount(id: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }
}
