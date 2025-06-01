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
