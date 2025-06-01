-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0.00,
  type TEXT NOT NULL CHECK (type IN ('cash', 'savings', 'credit card', 'line of credit', 'loan', 'insurance')),
  credit_limit DECIMAL(12,2),
  on_hold_amount DECIMAL(12,2) DEFAULT 0.00,
  remaining_credit_limit DECIMAL(12,2),
  statement_date INTEGER CHECK (statement_date >= 1 AND statement_date <= 31),
  days_due_after_statement_date INTEGER CHECK (days_due_after_statement_date >= 1 AND days_due_after_statement_date <= 31),
  annual_fee DECIMAL(12,2),
  af_waiver_spending_requirement DECIMAL(12,2),
  exclude_from_balances BOOLEAN DEFAULT FALSE,
  interest_rate DECIMAL(5,2),
  interest_frequency TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id); 