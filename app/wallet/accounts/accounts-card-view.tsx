"use client";

import { Account, AccountType } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  CreditCard,
  PiggyBank,
  Banknote,
  TrendingUp,
  Home,
  Shield,
} from "lucide-react";
import dayjs from "dayjs";
import { useState } from "react";

interface AccountsCardViewProps {
  accounts: Account[];
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
}

const getAccountIcon = (type: string) => {
  switch (type) {
    case "credit card":
    case "line of credit":
      return CreditCard;
    case "savings":
      return PiggyBank;
    case "cash":
      return Banknote;
    case "loan":
      return Home;
    case "insurance":
      return Shield;
    default:
      return TrendingUp;
  }
};

const getAccountTypeColor = (type: string) => {
  switch (type) {
    case "credit card":
      return "bg-blue-500/10 text-blue-600";
    case "line of credit":
      return "bg-purple-500/10 text-purple-600";
    case "savings":
      return "bg-green-500/10 text-green-600";
    case "cash":
      return "bg-yellow-500/10 text-yellow-600";
    case "loan":
      return "bg-orange-500/10 text-orange-600";
    case "insurance":
      return "bg-indigo-500/10 text-indigo-600";
    default:
      return "bg-gray-500/10 text-gray-600";
  }
};

const getAccountTextColor = (type: string) => {
  switch (type) {
    case "credit card":
      return "text-blue-600";
    case "line of credit":
      return "text-purple-600";
    case "savings":
      return "text-green-600";
    case "cash":
      return "text-yellow-600";
    case "loan":
      return "text-orange-600";
    case "insurance":
      return "text-indigo-600";
    default:
      return "text-gray-600";
  }
};

const getProgressBarColor = (type: string) => {
  switch (type) {
    case "credit card":
      return "bg-blue-500/20 [&>[data-slot=progress-indicator]]:bg-blue-500";
    case "line of credit":
      return "bg-purple-500/20 [&>[data-slot=progress-indicator]]:bg-purple-500";
    case "savings":
      return "bg-green-500/20 [&>[data-slot=progress-indicator]]:bg-green-500";
    case "cash":
      return "bg-yellow-500/20 [&>[data-slot=progress-indicator]]:bg-yellow-500";
    case "loan":
      return "bg-orange-500/20 [&>[data-slot=progress-indicator]]:bg-orange-500";
    case "insurance":
      return "bg-indigo-500/20 [&>[data-slot=progress-indicator]]:bg-indigo-500";
    default:
      return "bg-gray-500/20 [&>[data-slot=progress-indicator]]:bg-gray-500";
  }
};

const formatInterestFrequency = (frequency: string) => {
  const formatted = frequency.toLowerCase();
  switch (formatted) {
    case "daily":
      return "per day";
    case "monthly":
      return "per month";
    case "quarterly":
      return "per quarter";
    case "yearly":
      return "per year";
    default:
      return formatted;
  }
};

const formatAccountType = (type: string) => {
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function AccountsCardView({
  accounts,
  onEdit,
  onDelete,
}: AccountsCardViewProps) {
  const handleDelete = (id: string) => {
    onDelete?.(id);
  };

  // Define the desired order for account types
  const accountTypeOrder: AccountType[] = [
    "cash",
    "savings",
    "credit card",
    "line of credit",
    "loan",
    "insurance",
  ];

  // Group accounts by type
  const groupedAccounts = accounts.reduce((groups, account) => {
    const type = account.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, Account[]>);

  // Sort grouped accounts by the defined order
  const sortedGroupedAccounts = accountTypeOrder
    .filter((type) => groupedAccounts[type])
    .map((type) => [type, groupedAccounts[type]] as [string, Account[]]);

  const [expandedAccounts, setExpandedAccounts] = useState<
    Record<string, boolean>
  >({});

  const toggleExpand = (accountId: string) => {
    setExpandedAccounts((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  return (
    <div className="space-y-6">
      {sortedGroupedAccounts.map(([type, typeAccounts]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold capitalize">
              {formatAccountType(type)}
            </h3>
            <Badge variant="secondary">{typeAccounts.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
            {typeAccounts.map((account) => {
              const Icon = getAccountIcon(account.type);
              const isCredit =
                account.type === "credit card" ||
                account.type === "line of credit";
              const isLoan = account.type === "loan";
              const isInsurance = account.type === "insurance";
              const isExpanded = expandedAccounts[account.id];

              return (
                <Card
                  key={account.id}
                  className="relative py-4 sm:py-6 space-y-0 cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={() => toggleExpand(account.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${getAccountTypeColor(
                            account.type
                          )}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {account.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">
                              {formatAccountType(account.type)}
                            </Badge>
                            {account.loanType && (
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {formatAccountType(account.loanType)}
                              </Badge>
                            )}
                            {account.policyType && (
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {formatAccountType(account.policyType)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardAction>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View transactions</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(account)}>
                            Edit account
                          </DropdownMenuItem>
                          {onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  Delete account
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the account
                                    &quot;
                                    {account.name}&quot;. This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(account.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardAction>
                  </CardHeader>
                  <CardContent className={!isExpanded ? "pb-2" : ""}>
                    {/* Credit Card Info First */}
                    {isCredit && account.creditLimit && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Credit Limit
                            </p>
                            <p className="font-semibold">
                              {formatCurrency(account.creditLimit)}
                            </p>
                          </div>
                          {account.remainingCreditLimit && (
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Available
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(account.remainingCreditLimit)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Credit Utilization Progress Bar */}
                        {account.type === "credit card" &&
                          account.remainingCreditLimit && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-muted-foreground">
                                  Available Credit
                                </p>
                                <p className="text-sm font-medium">
                                  {(
                                    (account.remainingCreditLimit /
                                      account.creditLimit) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                              <Progress
                                value={
                                  (account.remainingCreditLimit /
                                    account.creditLimit) *
                                  100
                                }
                                className={`h-2 ${getProgressBarColor(
                                  account.type
                                )}`}
                              />
                            </div>
                          )}
                      </div>
                    )}

                    {/* Balance */}
                    <div
                      className={isCredit && account.creditLimit ? "mt-4" : ""}
                    >
                      <p className="text-sm text-muted-foreground">
                        {isLoan
                          ? "Remaining Balance"
                          : isInsurance
                          ? "Cash Value"
                          : "Balance"}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          account.balance >= 0
                            ? getAccountTextColor(account.type)
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(account.balance)}
                      </p>
                    </div>

                    {/* Expandable Details */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isExpanded
                          ? "max-h-[2000px] opacity-100 mt-4"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-4 pt-3 border-t">
                        {/* Bank/Institution */}
                        {account.bankInstitution && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Institution
                            </p>
                            <p className="font-medium">
                              {account.bankInstitution}
                            </p>
                          </div>
                        )}

                        {/* Account Number */}
                        {account.accountNumber && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Account Number
                            </p>
                            <p className="font-medium">
                              ****{account.accountNumber}
                            </p>
                          </div>
                        )}

                        {/* Credit Card Additional Details */}
                        {isCredit && (
                          <>
                            {account.onHoldAmount > 0 && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  On Hold
                                </p>
                                <p className="font-semibold">
                                  {formatCurrency(account.onHoldAmount)}
                                </p>
                              </div>
                            )}

                            {/* Interest Information for Credit Products */}
                            {account.interestRate && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Interest Rate
                                </p>
                                <p className="font-semibold">
                                  {account.interestRate.toFixed(2)}%
                                  {account.interestFrequency &&
                                    ` ${formatInterestFrequency(
                                      account.interestFrequency
                                    )}`}
                                </p>
                              </div>
                            )}

                            {/* Credit Card Details */}
                            {account.type === "credit card" && (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {account.statementDate && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Statement Date
                                    </p>
                                    <p className="font-medium">
                                      {account.statementDate}
                                    </p>
                                  </div>
                                )}
                                {account.daysDueAfterStatementDate && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Days Due
                                    </p>
                                    <p className="font-medium">
                                      {account.daysDueAfterStatementDate}
                                    </p>
                                  </div>
                                )}
                                {account.annualFee && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Annual Fee
                                    </p>
                                    <p className="font-medium">
                                      {formatCurrency(account.annualFee)}
                                    </p>
                                  </div>
                                )}
                                {account.afWaiverSpendingRequirement && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      AF Waiver Req.
                                    </p>
                                    <p className="font-medium text-xs">
                                      {formatCurrency(
                                        account.afWaiverSpendingRequirement
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* Loan Information */}
                        {isLoan && (
                          <>
                            {account.originalLoanAmount && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Original Amount
                                  </p>
                                  <p className="font-semibold">
                                    {formatCurrency(account.originalLoanAmount)}
                                  </p>
                                </div>
                                {account.monthlyPaymentAmount && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Monthly Payment
                                    </p>
                                    <p className="font-semibold">
                                      {formatCurrency(
                                        account.monthlyPaymentAmount
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Loan Progress Bar */}
                            {account.originalLoanAmount &&
                              account.balance >= 0 && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                      Loan Progress
                                    </p>
                                    <p className="text-sm font-medium">
                                      {(
                                        (1 -
                                          account.balance /
                                            account.originalLoanAmount) *
                                        100
                                      ).toFixed(1)}
                                      % paid
                                    </p>
                                  </div>
                                  <Progress
                                    value={
                                      (1 -
                                        account.balance /
                                          account.originalLoanAmount) *
                                      100
                                    }
                                    className={`h-2 ${getProgressBarColor(
                                      account.type
                                    )}`}
                                  />
                                </div>
                              )}

                            {/* Loan Dates */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {account.loanStartDate && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Start Date
                                  </p>
                                  <p className="font-medium">
                                    {dayjs(account.loanStartDate).format(
                                      "MMM D, YYYY"
                                    )}
                                  </p>
                                </div>
                              )}
                              {account.maturityDate && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Maturity Date
                                  </p>
                                  <p className="font-medium">
                                    {dayjs(account.maturityDate).format(
                                      "MMM D, YYYY"
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>

                            {account.loanTermMonths && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Loan Term
                                </p>
                                <p className="font-medium">
                                  {account.loanTermMonths} months (
                                  {(account.loanTermMonths / 12).toFixed(1)}{" "}
                                  years)
                                </p>
                              </div>
                            )}

                            {/* Interest Information for Loans */}
                            {account.interestRate && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Interest Rate
                                </p>
                                <p className="font-semibold">
                                  {account.interestRate.toFixed(2)}%
                                  {account.interestFrequency &&
                                    ` ${formatInterestFrequency(
                                      account.interestFrequency
                                    )}`}
                                </p>
                              </div>
                            )}
                          </>
                        )}

                        {/* Insurance Information */}
                        {isInsurance && (
                          <>
                            {account.premiumAmount && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    Premium Amount
                                  </p>
                                  <p className="font-semibold">
                                    {formatCurrency(account.premiumAmount)}
                                  </p>
                                </div>
                                {account.premiumFrequency && (
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      Premium Frequency
                                    </p>
                                    <p className="font-semibold">
                                      {account.premiumFrequency}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {account.coverageAmount && (
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Coverage Amount
                                </p>
                                <p className="font-semibold">
                                  {formatCurrency(account.coverageAmount)}
                                </p>
                              </div>
                            )}

                            {/* Policy Dates */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              {account.policyStartDate && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Policy Start
                                  </p>
                                  <p className="font-medium">
                                    {dayjs(account.policyStartDate).format(
                                      "MMM D, YYYY"
                                    )}
                                  </p>
                                </div>
                              )}
                              {account.policyEndDate && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Policy End
                                  </p>
                                  <p className="font-medium">
                                    {dayjs(account.policyEndDate).format(
                                      "MMM D, YYYY"
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Interest Information for Non-Credit, Non-Loan Accounts */}
                        {!isCredit && !isLoan && account.interestRate && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Interest Rate
                            </p>
                            <p className="font-semibold">
                              {account.interestRate.toFixed(2)}%
                              {account.interestFrequency &&
                                ` ${formatInterestFrequency(
                                  account.interestFrequency
                                )}`}
                            </p>
                          </div>
                        )}

                        {/* Optional Fields */}
                        {(Boolean(account.minimumBalance) ||
                          Boolean(account.monthlyMaintenanceFee)) && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {account.minimumBalance && (
                              <div>
                                <p className="text-muted-foreground">
                                  Minimum Balance
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(account.minimumBalance)}
                                </p>
                              </div>
                            )}
                            {account.monthlyMaintenanceFee && (
                              <div>
                                <p className="text-muted-foreground">
                                  Monthly Fee
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(
                                    account.monthlyMaintenanceFee
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {account.excludeFromBalances && (
                          <div>
                            <Badge variant="outline" className="text-xs">
                              Excluded from balances
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {accounts.length === 0 && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No accounts found.</p>
        </div>
      )}
    </div>
  );
}
