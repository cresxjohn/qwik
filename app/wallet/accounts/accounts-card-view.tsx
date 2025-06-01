"use client";

import { Account } from "@/shared/types";
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
} from "lucide-react";
import { toast } from "sonner";

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
    default:
      return "bg-gray-500/20 [&>[data-slot=progress-indicator]]:bg-gray-500";
  }
};

export function AccountsCardView({
  accounts,
  onEdit,
  onDelete,
}: AccountsCardViewProps) {
  const handleDelete = (id: string) => {
    onDelete?.(id);
    toast.success("Account deleted successfully");
  };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((groups, account) => {
    const type = account.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, Account[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
        <div key={type} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold capitalize">{type}</h3>
            <Badge variant="secondary">{typeAccounts.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typeAccounts.map((account) => {
              const Icon = getAccountIcon(account.type);
              const isCredit =
                account.type === "credit card" ||
                account.type === "line of credit";

              return (
                <Card key={account.id} className="relative">
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
                          <Badge variant="outline" className="mt-1 capitalize">
                            {account.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardAction>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                  <CardContent className="space-y-4">
                    {/* Balance */}
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
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

                    {/* Credit Information */}
                    {isCredit && account.creditLimit && (
                      <div className="space-y-3 pt-3 border-t">
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
                                ` ${account.interestFrequency
                                  .toLowerCase()
                                  .replace("yearly", "per year")}`}
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
                      </div>
                    )}

                    {/* Interest Information for Non-Credit Accounts */}
                    {!isCredit && account.interestRate && (
                      <div className="space-y-3 pt-3 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Interest Rate
                          </p>
                          <p className="font-semibold">
                            {account.interestRate.toFixed(2)}%
                            {account.interestFrequency &&
                              ` ${account.interestFrequency
                                .toLowerCase()
                                .replace("yearly", "per year")}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {account.excludeFromBalances && (
                      <div className="pt-3 border-t">
                        <Badge variant="outline" className="text-xs">
                          Excluded from balances
                        </Badge>
                      </div>
                    )}
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
