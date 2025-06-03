-- Add new fields to accounts table for comprehensive account tracking

-- Loan specific fields
ALTER TABLE accounts ADD COLUMN original_loan_amount DECIMAL(12,2);
ALTER TABLE accounts ADD COLUMN monthly_payment_amount DECIMAL(12,2);
ALTER TABLE accounts ADD COLUMN loan_start_date TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN maturity_date TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN loan_term_months INTEGER CHECK (loan_term_months > 0);
ALTER TABLE accounts ADD COLUMN loan_type TEXT CHECK (loan_type IN ('mortgage', 'auto', 'personal', 'student', 'business', 'other'));

-- Insurance specific fields
ALTER TABLE accounts ADD COLUMN policy_type TEXT CHECK (policy_type IN ('life', 'health', 'auto', 'home', 'renters', 'disability', 'other'));
ALTER TABLE accounts ADD COLUMN premium_amount DECIMAL(12,2);
ALTER TABLE accounts ADD COLUMN premium_frequency TEXT;
ALTER TABLE accounts ADD COLUMN coverage_amount DECIMAL(12,2);
ALTER TABLE accounts ADD COLUMN policy_start_date TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN policy_end_date TIMESTAMPTZ;

-- Optional fields for all account types
ALTER TABLE accounts ADD COLUMN bank_institution TEXT;
ALTER TABLE accounts ADD COLUMN account_number TEXT CHECK (LENGTH(account_number) <= 4);
ALTER TABLE accounts ADD COLUMN minimum_balance DECIMAL(12,2);
ALTER TABLE accounts ADD COLUMN monthly_maintenance_fee DECIMAL(12,2);

-- Create indexes for performance
CREATE INDEX idx_accounts_loan_type ON accounts(loan_type) WHERE loan_type IS NOT NULL;
CREATE INDEX idx_accounts_policy_type ON accounts(policy_type) WHERE policy_type IS NOT NULL;
CREATE INDEX idx_accounts_bank_institution ON accounts(bank_institution) WHERE bank_institution IS NOT NULL;
CREATE INDEX idx_accounts_maturity_date ON accounts(maturity_date) WHERE maturity_date IS NOT NULL;
CREATE INDEX idx_accounts_policy_end_date ON accounts(policy_end_date) WHERE policy_end_date IS NOT NULL;

-- Add flexible constraints that don't require ALL fields to be filled
-- Only ensure that values are valid when present

-- Ensure positive amounts when present
ALTER TABLE accounts ADD CONSTRAINT check_positive_amounts CHECK (
  (original_loan_amount IS NULL OR original_loan_amount > 0) AND
  (monthly_payment_amount IS NULL OR monthly_payment_amount >= 0) AND
  (premium_amount IS NULL OR premium_amount > 0) AND
  (coverage_amount IS NULL OR coverage_amount > 0) AND
  (minimum_balance IS NULL OR minimum_balance >= 0) AND
  (monthly_maintenance_fee IS NULL OR monthly_maintenance_fee >= 0)
);

-- Date constraints (these make sense to keep)
ALTER TABLE accounts ADD CONSTRAINT check_loan_dates CHECK (
  (loan_start_date IS NULL OR maturity_date IS NULL OR maturity_date > loan_start_date)
);

ALTER TABLE accounts ADD CONSTRAINT check_policy_dates CHECK (
  (policy_start_date IS NULL OR policy_end_date IS NULL OR policy_end_date > policy_start_date)
);

-- Comments for documentation
COMMENT ON COLUMN accounts.original_loan_amount IS 'Initial amount borrowed for loan accounts';
COMMENT ON COLUMN accounts.monthly_payment_amount IS 'Required monthly payment for loan accounts';
COMMENT ON COLUMN accounts.loan_start_date IS 'Date when the loan was originated';
COMMENT ON COLUMN accounts.maturity_date IS 'Date when the loan will be fully paid off';
COMMENT ON COLUMN accounts.loan_term_months IS 'Total loan term in months';
COMMENT ON COLUMN accounts.loan_type IS 'Category of loan (mortgage, auto, personal, etc.)';
COMMENT ON COLUMN accounts.policy_type IS 'Type of insurance policy';
COMMENT ON COLUMN accounts.premium_amount IS 'Amount paid per premium period';
COMMENT ON COLUMN accounts.premium_frequency IS 'How often premiums are paid';
COMMENT ON COLUMN accounts.coverage_amount IS 'Maximum coverage or benefit amount';
COMMENT ON COLUMN accounts.policy_start_date IS 'Date when the insurance policy became effective';
COMMENT ON COLUMN accounts.policy_end_date IS 'Date when the insurance policy expires';
COMMENT ON COLUMN accounts.bank_institution IS 'Name of the financial institution';
COMMENT ON COLUMN accounts.account_number IS 'Last 4 digits of account number for identification';
COMMENT ON COLUMN accounts.minimum_balance IS 'Minimum balance required to avoid fees';
COMMENT ON COLUMN accounts.monthly_maintenance_fee IS 'Monthly fee charged for maintaining the account'; 