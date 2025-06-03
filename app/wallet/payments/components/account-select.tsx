"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAccountsStore } from "@/store/accounts";
import { Account } from "@/shared/types";
import { AccountForm } from "@/app/wallet/accounts/account-form";
import { formatCurrency } from "@/shared/utils";
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const formatAccountType = (type: string) => {
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function AccountSelect({
  value,
  onValueChange,
  placeholder = "Select account...",
  className,
}: AccountSelectProps) {
  const [open, setOpen] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const accountsStore = useAccountsStore();

  // Load accounts when component mounts
  useEffect(() => {
    if (accountsStore.items.length === 0) {
      accountsStore.loadAccounts();
    }
  }, [accountsStore]);

  const selectedAccount = accountsStore.items.find(
    (account) => account.name === value
  );

  const isLoading = accountsStore.loading;

  // Filter accounts to only show payment-related types
  const filteredAccounts = accountsStore.items.filter((account) =>
    ["cash", "savings", "credit card", "line of credit"].includes(account.type)
  );

  const handleCreateAccount = async (
    accountData: Omit<Account, "id" | "remainingCreditLimit">
  ) => {
    try {
      const newAccount = await accountsStore.addAccount(accountData);
      setShowAccountForm(false);

      // Check if the created account type can be used for payments
      if (["loan", "insurance"].includes(newAccount.type)) {
        // Show error toast for unsupported account types
        const { toast } = await import("sonner");
        toast.error(
          `${formatAccountType(
            newAccount.type
          )} accounts cannot be used for payments. Please select a different account.`
        );
        // Don't select the account, leave field empty
        setOpen(false);
        return;
      }

      // Select the account if it's a valid payment type
      onValueChange(newAccount.name);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create account:", error);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {selectedAccount ? selectedAccount.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search accounts..." />
            <CommandList>
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading accounts...
                </div>
              ) : (
                <>
                  <CommandGroup className="overflow-auto">
                    <CommandEmpty>No account found.</CommandEmpty>
                    {filteredAccounts.map((account) => (
                      <CommandItem
                        key={account.id}
                        value={account.name}
                        onSelect={(currentValue) => {
                          onValueChange(
                            currentValue === value ? "" : currentValue
                          );
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === account.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatAccountType(account.type)} • Balance:{" "}
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setShowAccountForm(true);
                        setOpen(false);
                      }}
                      className="bg-background text-primary hover:text-primary font-medium"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create new account
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Sheet open={showAccountForm} onOpenChange={setShowAccountForm}>
        <SheetContent className="w-full sm:max-w-md h-full overflow-hidden p-0 gap-0 flex flex-col">
          <SheetHeader className="p-4 shrink-0">
            <SheetTitle>Create Account</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <AccountForm
              onCancel={() => setShowAccountForm(false)}
              onSubmit={handleCreateAccount}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
