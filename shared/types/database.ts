export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          name: string;
          balance: number;
          type:
            | "cash"
            | "savings"
            | "credit card"
            | "line of credit"
            | "loan"
            | "insurance";
          credit_limit: number | null;
          on_hold_amount: number;
          remaining_credit_limit: number | null;
          statement_date: number | null;
          days_due_after_statement_date: number | null;
          annual_fee: number | null;
          af_waiver_spending_requirement: number | null;
          exclude_from_balances: boolean;
          interest_rate: number | null;
          interest_frequency: string | null;
          // Loan specific fields
          original_loan_amount: number | null;
          monthly_payment_amount: number | null;
          loan_start_date: string | null;
          maturity_date: string | null;
          loan_term_months: number | null;
          loan_type:
            | "mortgage"
            | "auto"
            | "personal"
            | "student"
            | "business"
            | "other"
            | null;
          // Insurance specific fields
          policy_type:
            | "life"
            | "health"
            | "auto"
            | "home"
            | "renters"
            | "disability"
            | "other"
            | null;
          premium_amount: number | null;
          premium_frequency: string | null;
          coverage_amount: number | null;
          policy_start_date: string | null;
          policy_end_date: string | null;
          // Optional fields for all types
          bank_institution: string | null;
          account_number: string | null;
          minimum_balance: number | null;
          monthly_maintenance_fee: number | null;
          // System fields
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          balance?: number;
          type:
            | "cash"
            | "savings"
            | "credit card"
            | "line of credit"
            | "loan"
            | "insurance";
          credit_limit?: number | null;
          on_hold_amount?: number;
          remaining_credit_limit?: number | null;
          statement_date?: number | null;
          days_due_after_statement_date?: number | null;
          annual_fee?: number | null;
          af_waiver_spending_requirement?: number | null;
          exclude_from_balances?: boolean;
          interest_rate?: number | null;
          interest_frequency?: string | null;
          // Loan specific fields
          original_loan_amount?: number | null;
          monthly_payment_amount?: number | null;
          loan_start_date?: string | null;
          maturity_date?: string | null;
          loan_term_months?: number | null;
          loan_type?:
            | "mortgage"
            | "auto"
            | "personal"
            | "student"
            | "business"
            | "other"
            | null;
          // Insurance specific fields
          policy_type?:
            | "life"
            | "health"
            | "auto"
            | "home"
            | "renters"
            | "disability"
            | "other"
            | null;
          premium_amount?: number | null;
          premium_frequency?: string | null;
          coverage_amount?: number | null;
          policy_start_date?: string | null;
          policy_end_date?: string | null;
          // Optional fields for all types
          bank_institution?: string | null;
          account_number?: string | null;
          minimum_balance?: number | null;
          monthly_maintenance_fee?: number | null;
          // System fields
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          balance?: number;
          type?:
            | "cash"
            | "savings"
            | "credit card"
            | "line of credit"
            | "loan"
            | "insurance";
          credit_limit?: number | null;
          on_hold_amount?: number;
          remaining_credit_limit?: number | null;
          statement_date?: number | null;
          days_due_after_statement_date?: number | null;
          annual_fee?: number | null;
          af_waiver_spending_requirement?: number | null;
          exclude_from_balances?: boolean;
          interest_rate?: number | null;
          interest_frequency?: string | null;
          // Loan specific fields
          original_loan_amount?: number | null;
          monthly_payment_amount?: number | null;
          loan_start_date?: string | null;
          maturity_date?: string | null;
          loan_term_months?: number | null;
          loan_type?:
            | "mortgage"
            | "auto"
            | "personal"
            | "student"
            | "business"
            | "other"
            | null;
          // Insurance specific fields
          policy_type?:
            | "life"
            | "health"
            | "auto"
            | "home"
            | "renters"
            | "disability"
            | "other"
            | null;
          premium_amount?: number | null;
          premium_frequency?: string | null;
          coverage_amount?: number | null;
          policy_start_date?: string | null;
          policy_end_date?: string | null;
          // Optional fields for all types
          bank_institution?: string | null;
          account_number?: string | null;
          minimum_balance?: number | null;
          monthly_maintenance_fee?: number | null;
          // System fields
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          name: string;
          amount: number;
          account: string;
          to_account: string | null;
          payment_type: "income" | "expense" | "transfer";
          category: string;
          tags: string[] | null;
          recurring: boolean;
          link: string | null;
          start_date: string;
          last_payment_date: string;
          next_due_date: string;
          payment_date: string;
          end_date: string | null;
          notes: string | null;
          attachments: string[] | null;
          confirmation_type: "manual" | "automatic";
          recurrence: any; // JSON object
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          amount: number;
          account: string;
          to_account?: string | null;
          payment_type: "income" | "expense" | "transfer";
          category: string;
          tags?: string[] | null;
          recurring?: boolean;
          link?: string | null;
          start_date: string;
          last_payment_date?: string;
          next_due_date?: string;
          payment_date?: string;
          end_date?: string | null;
          notes?: string | null;
          attachments?: string[] | null;
          confirmation_type?: "manual" | "automatic";
          recurrence?: any; // JSON object
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          account?: string;
          to_account?: string | null;
          payment_type?: "income" | "expense" | "transfer";
          category?: string;
          tags?: string[] | null;
          recurring?: boolean;
          link?: string | null;
          start_date?: string;
          last_payment_date?: string;
          next_due_date?: string;
          payment_date?: string;
          end_date?: string | null;
          notes?: string | null;
          attachments?: string[] | null;
          confirmation_type?: "manual" | "automatic";
          recurrence?: any; // JSON object
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
