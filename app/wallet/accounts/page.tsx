"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsCardView } from "./accounts-card-view";
import { AccountsTable } from "./accounts-table";
import { AccountForm } from "./account-form";
import { formatCurrency } from "@/shared/utils";
import {
  PiggyBank,
  CreditCard,
  Banknote,
  TrendingDown,
  LayoutGrid,
  Table,
} from "lucide-react";
import { useState } from "react";
import type { AccountType, Account } from "@/shared/types";
import { toast } from "sonner";
import { useAccountsStore } from "@/store/accounts";

export default function Page() {
  const {
    items: accounts,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useAccountsStore();
  const [selectedAccountType, setSelectedAccountType] = useState<
    AccountType | "all"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

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

  // Filter accounts based on selected type
  const filteredAccounts =
    selectedAccountType === "all"
      ? accounts
      : accounts.filter((account) => account.type === selectedAccountType);

  // Get unique account types for tabs
  const accountTypes: (AccountType | "all")[] = [
    "all",
    ...Array.from(new Set(accounts.map((account) => account.type))),
  ];

  const formatTabName = (type: AccountType | "all") => {
    if (type === "all") return "All";
    return type
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("Account created successfully");
  };

  const handleEditSuccess = () => {
    setEditingAccount(undefined);
    toast.success("Account updated successfully");
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    toast.success("Account deleted successfully");
  };

  const handleCreateAccount = (
    accountData: Omit<Account, "id" | "remainingCreditLimit">
  ) => {
    const newAccount: Account = {
      ...accountData,
      id: crypto.randomUUID(),
      remainingCreditLimit: accountData.creditLimit
        ? accountData.creditLimit +
          accountData.balance -
          accountData.onHoldAmount
        : null,
    };
    addAccount(newAccount);
  };

  const handleUpdateAccount = (
    accountData: Omit<Account, "id" | "remainingCreditLimit">
  ) => {
    if (!editingAccount) return;
    const updatedAccount: Account = {
      ...accountData,
      id: editingAccount.id,
      remainingCreditLimit: accountData.creditLimit
        ? accountData.creditLimit +
          accountData.balance -
          accountData.onHoldAmount
        : null,
    };
    updateAccount(updatedAccount);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/wallet">Wallet</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Accounts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold mb-1">Accounts</p>
            <p className="text-sm font-light">Manage your accounts.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>Add Account</Button>
        </div>

        {/* Summary Widgets */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Loan Outstanding
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalLoanOutstanding)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total loan balances
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

        <Tabs defaultValue="cards" className="space-y-4">
          <div className="flex justify-end">
            <TabsList>
              <TabsTrigger value="cards">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table">
                <Table className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="cards" className="space-y-4 mb-6">
            {/* Account Type Filter Tabs */}
            <Tabs
              value={selectedAccountType}
              onValueChange={(value) =>
                setSelectedAccountType(value as AccountType | "all")
              }
              className="mb-10"
            >
              <div className="w-full overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="inline-flex w-max min-w-full justify-start">
                    {accountTypes.map((type) => (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className="px-6 capitalize whitespace-nowrap flex-shrink-0"
                      >
                        {formatTabName(type)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
            </Tabs>
            <AccountsCardView
              accounts={filteredAccounts}
              onEdit={setEditingAccount}
              onDelete={handleDelete}
            />
          </TabsContent>
          <TabsContent value="table" className="space-y-4 mb-6">
            <AccountsTable
              accounts={accounts}
              onEdit={setEditingAccount}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>

        {/* Create Account Sheet */}
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetContent className="w-full sm:w-[420px] sm:max-w-[420px] overflow-y-auto p-0 gap-0">
            <SheetHeader className="p-4">
              <SheetTitle>Create Account</SheetTitle>
            </SheetHeader>
            <AccountForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateOpen(false)}
              onSubmit={handleCreateAccount}
            />
          </SheetContent>
        </Sheet>

        {/* Edit Account Sheet */}
        <Sheet
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(undefined)}
        >
          <SheetContent className="w-full sm:w-[420px] sm:max-w-[420px] overflow-y-auto p-0 gap-0">
            <SheetHeader className="p-4">
              <SheetTitle>Edit Account</SheetTitle>
            </SheetHeader>
            <AccountForm
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingAccount(undefined)}
              initialData={editingAccount}
              onSubmit={handleUpdateAccount}
            />
          </SheetContent>
        </Sheet>
      </div>
    </SidebarInset>
  );
}
