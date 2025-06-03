"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Account, AccountType } from "@/shared/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface AccountFormProps {
  onCancel: () => void;
  initialData?: Account;
  onSubmit: (accountData: Omit<Account, "id" | "remainingCreditLimit">) => void;
}

const accountTypes: {
  value: AccountType;
  label: string;
  description: string;
}[] = [
  {
    value: "cash",
    label: "Cash",
    description: "Physical cash or checking accounts",
  },
  {
    value: "savings",
    label: "Savings",
    description: "Interest-earning savings accounts",
  },
  {
    value: "credit card",
    label: "Credit Card",
    description: "Revolving credit accounts",
  },
  {
    value: "line of credit",
    label: "Line of Credit",
    description: "Flexible borrowing accounts",
  },
  { value: "loan", label: "Loan", description: "Fixed-term borrowing" },
  {
    value: "insurance",
    label: "Insurance",
    description: "Insurance policies or funds",
  },
];

export function AccountForm({
  onCancel,
  initialData,
  onSubmit,
}: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || ("" as AccountType),
    balance: initialData?.balance?.toString() || "",
    creditLimit: initialData?.creditLimit?.toString() || "",
    onHoldAmount: initialData?.onHoldAmount?.toString() || "",
    statementDate: initialData?.statementDate?.toString() || "",
    daysDueAfterStatementDate:
      initialData?.daysDueAfterStatementDate?.toString() || "",
    annualFee: initialData?.annualFee?.toString() || "",
    afWaiverSpendingRequirement:
      initialData?.afWaiverSpendingRequirement?.toString() || "",
    interestRate: initialData?.interestRate?.toString() || "",
    interestFrequency: initialData?.interestFrequency || "",
    excludeFromBalances: initialData?.excludeFromBalances || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.type) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const accountData: Omit<Account, "id" | "remainingCreditLimit"> = {
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        creditLimit: formData.creditLimit
          ? parseFloat(formData.creditLimit)
          : null,
        onHoldAmount: parseFloat(formData.onHoldAmount) || 0,
        statementDate: formData.statementDate
          ? parseInt(formData.statementDate)
          : null,
        daysDueAfterStatementDate: formData.daysDueAfterStatementDate
          ? parseInt(formData.daysDueAfterStatementDate)
          : null,
        annualFee: formData.annualFee ? parseFloat(formData.annualFee) : null,
        afWaiverSpendingRequirement: formData.afWaiverSpendingRequirement
          ? parseFloat(formData.afWaiverSpendingRequirement)
          : null,
        interestRate: formData.interestRate
          ? parseFloat(formData.interestRate)
          : null,
        interestFrequency: formData.interestFrequency || null,
        excludeFromBalances: formData.excludeFromBalances,
      };

      await onSubmit(accountData);
    } catch (error) {
      console.error("Failed to save account:", error);
      setError("Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  const isCreditType =
    formData.type === "credit card" || formData.type === "line of credit";
  const isSavingsType = formData.type === "savings";

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col h-full">
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Tabs
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as AccountType })
              }
              className="w-full"
            >
              <div className="w-full overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="inline-flex w-max min-w-full sm:w-fit sm:min-w-fit justify-start">
                    {accountTypes.map((type) => (
                      <TabsTrigger
                        key={type.value}
                        value={type.value}
                        className="px-4 whitespace-nowrap flex-shrink-0"
                      >
                        {type.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              {formData.type
                ? accountTypes.find((t) => t.value === formData.type)
                    ?.description
                : "Choose the type of account you want to create"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., BPI Savings Account"
              required
            />
            <p className="text-sm text-muted-foreground">
              A descriptive name to identify this account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: e.target.value })
              }
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground">
              Current account balance (use negative for credit balances)
            </p>
          </div>

          {isCreditType && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, creditLimit: e.target.value })
                  }
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum amount you can borrow on this account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onHoldAmount">On Hold Amount</Label>
                <Input
                  id="onHoldAmount"
                  type="number"
                  step="0.01"
                  value={formData.onHoldAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, onHoldAmount: e.target.value })
                  }
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground">
                  Amount temporarily held or pending transactions
                </p>
              </div>

              {formData.type === "credit card" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="statementDate">Statement Date</Label>
                    <Input
                      id="statementDate"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.statementDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statementDate: e.target.value,
                        })
                      }
                      placeholder="e.g., 15"
                    />
                    <p className="text-sm text-muted-foreground">
                      Day of the month when your statement is generated
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="daysDue">Days Due After Statement</Label>
                    <Input
                      id="daysDue"
                      type="number"
                      min="1"
                      value={formData.daysDueAfterStatementDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          daysDueAfterStatementDate: e.target.value,
                        })
                      }
                      placeholder="e.g., 25"
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of days from statement date to payment due date
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annualFee">Annual Fee</Label>
                    <Input
                      id="annualFee"
                      type="number"
                      step="0.01"
                      value={formData.annualFee}
                      onChange={(e) =>
                        setFormData({ ...formData, annualFee: e.target.value })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Yearly fee charged for maintaining this credit card
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="afWaiver">
                      Annual Fee Waiver Requirement
                    </Label>
                    <Input
                      id="afWaiver"
                      type="number"
                      step="0.01"
                      value={formData.afWaiverSpendingRequirement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          afWaiverSpendingRequirement: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum annual spending to waive the annual fee
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          {(isCreditType || isSavingsType) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRate: e.target.value })
                  }
                  placeholder="e.g., 3.50"
                />
                <p className="text-sm text-muted-foreground">
                  {isSavingsType
                    ? "Annual percentage yield earned on your balance"
                    : "Annual percentage rate charged on outstanding balances"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestFrequency">Interest Frequency</Label>
                <Select
                  value={formData.interestFrequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, interestFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How often interest is calculated and applied
                </p>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="excludeFromBalances"
              checked={formData.excludeFromBalances}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, excludeFromBalances: !!checked })
              }
            />
            <Label htmlFor="excludeFromBalances">
              Exclude from balance calculations
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Hide this account from total balance summaries and reports
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4">
        {error && (
          <div className="text-sm text-red-500 text-center mb-4">{error}</div>
        )}
        <div className="flex justify-end gap-2 flex-wrap">
          <Button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto order-first md:order-last"
          >
            {loading && <Loader2 className="mr-2 h-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full md:w-auto order-last md:order-first"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
