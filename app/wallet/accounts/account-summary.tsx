"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/shared/utils";
import { PiggyBank, CreditCard, Banknote, TrendingDown } from "lucide-react";
import type { Account } from "@/shared/types";

interface AccountSummaryProps {
  accounts: Account[];
}

export function AccountSummary({ accounts }: AccountSummaryProps) {
  // Calculate summary metrics
  const totalBalance = accounts
    .filter(
      (account) =>
        !account.excludeFromBalances &&
        (account.type === "cash" || account.type === "savings")
    )
    .reduce((sum, account) => sum + account.balance, 0);

  const totalLoanOutstanding = accounts
    .filter(
      (account) => !account.excludeFromBalances && account.type === "loan"
    )
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  const totalCreditBalances = accounts
    .filter(
      (account) =>
        !account.excludeFromBalances &&
        (account.type === "credit card" || account.type === "line of credit")
    )
    .reduce((sum, account) => sum + Math.abs(account.balance), 0);

  const totalRemainingCredits = accounts
    .filter(
      (account) =>
        !account.excludeFromBalances &&
        (account.type === "credit card" || account.type === "line of credit")
    )
    .reduce((sum, account) => sum + (account.remainingCreditLimit || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">Cash + Savings</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            Loan Outstanding
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalLoanOutstanding)}
          </div>
          <p className="text-xs text-muted-foreground">Total loan balances</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Credit Used</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalCreditBalances)}
          </div>
          <p className="text-xs text-muted-foreground">
            Credit cards + Lines of credit
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            Available Credit
          </CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalRemainingCredits)}
          </div>
          <p className="text-xs text-muted-foreground">
            Remaining credit limits
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
