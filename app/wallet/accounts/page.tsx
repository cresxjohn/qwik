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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import type { Account, AccountType } from "@/shared/types";
import { useAccountsStore } from "@/store/accounts";
import { LayoutGrid, Table } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountForm } from "./account-form";
import { AccountSummary } from "./account-summary";
import { AccountsCardView } from "./accounts-card-view";
import { AccountsTable } from "./accounts-table";
import { ImportSheet } from "./import-sheet";

export default function Page() {
  const {
    items: accounts,
    loading,
    error,
    loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  } = useAccountsStore();
  const [selectedAccountType, setSelectedAccountType] = useState<
    AccountType | "all"
  >("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      toast.success("Account deleted successfully");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const handleCreateAccount = async (
    accountData: Omit<Account, "id" | "remainingCreditLimit">
  ) => {
    try {
      await addAccount(accountData);
      handleCreateSuccess();
    } catch {
      toast.error("Failed to create account");
    }
  };

  const handleUpdateAccount = async (
    accountData: Omit<Account, "id" | "remainingCreditLimit">
  ) => {
    if (!editingAccount) return;

    try {
      const updatedAccount: Account = {
        ...accountData,
        id: editingAccount.id,
        remainingCreditLimit: accountData.creditLimit
          ? accountData.creditLimit +
            accountData.balance -
            accountData.onHoldAmount
          : null,
      };
      await updateAccount(updatedAccount);
      handleEditSuccess();
    } catch {
      toast.error("Failed to update account");
    }
  };

  // Show loading state
  if (loading && accounts.length === 0) {
    return (
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background sm:rounded-4xl flex h-16 shrink-0 items-center gap-2">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading accounts...</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 bg-background sm:rounded-4xl flex h-16 shrink-0 items-center gap-2">
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

      <PullToRefresh
        onRefresh={loadAccounts}
        disabled={loading}
        className="flex-1"
      >
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold mb-1">Accounts</p>
                <p className="text-sm font-light">Manage your accounts.</p>
              </div>
              {/* Buttons for larger screens */}
              <div className="hidden sm:flex gap-2">
                <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                  Import
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                  Add Account
                </Button>
              </div>
            </div>
            {/* Buttons for smaller screens */}
            <div className="flex sm:hidden gap-2 my-4">
              <Button onClick={() => setIsCreateOpen(true)}>Add Account</Button>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                Import
              </Button>
            </div>
          </div>

          {/* Summary Widgets */}
          <AccountSummary accounts={accounts} />

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
            <TabsContent value="cards" className="space-y-4">
              {/* Account Type Filter Tabs */}
              {accountTypes.length > 2 && (
                <Tabs
                  value={selectedAccountType}
                  onValueChange={(value) =>
                    setSelectedAccountType(value as AccountType | "all")
                  }
                  className="mb-10"
                >
                  <div className="w-full overflow-hidden">
                    <div className="overflow-x-auto scrollbar-hide">
                      <TabsList className="inline-flex w-max min-w-full sm:w-fit sm:min-w-fit justify-start">
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
              )}
              <AccountsCardView
                accounts={filteredAccounts}
                onEdit={setEditingAccount}
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="table" className="space-y-4">
              <AccountsTable
                accounts={accounts}
                onEdit={setEditingAccount}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PullToRefresh>

      {/* Create Account Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-full sm:w-[420px] sm:max-w-[420px] overflow-y-auto p-0 gap-0">
          <SheetHeader className="p-4">
            <SheetTitle>Create Account</SheetTitle>
          </SheetHeader>
          <AccountForm
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
            onCancel={() => setEditingAccount(undefined)}
            initialData={editingAccount}
            onSubmit={handleUpdateAccount}
          />
        </SheetContent>
      </Sheet>

      {/* Import Account Sheet */}
      <ImportSheet open={isImportOpen} onOpenChange={setIsImportOpen} />
    </SidebarInset>
  );
}
