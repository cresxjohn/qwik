"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

interface AccountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Account;
  onSubmit: (accountData: Omit<Account, "id" | "remainingCreditLimit">) => void;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "savings", label: "Savings" },
  { value: "credit card", label: "Credit Card" },
  { value: "line of credit", label: "Line of Credit" },
  { value: "loan", label: "Loan" },
  { value: "insurance", label: "Insurance" },
];

export function AccountForm({
  onSuccess,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      toast.error("Please fill in all required fields");
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

      onSubmit(accountData);
      onSuccess();
    } catch (error) {
      console.error("Failed to save account:", error);
      toast.error("Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  const isCreditType =
    formData.type === "credit card" || formData.type === "line of credit";
  const isSavingsType = formData.type === "savings";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Account Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., BPI Savings Account"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Account Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({ ...formData, type: value as AccountType })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              {accountTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="balance">Balance</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="afWaiver">
                    AF Waiver Spending Requirement
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
          <Label htmlFor="excludeFromBalances">Exclude from balances</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading
            ? "Saving..."
            : initialData
            ? "Update Account"
            : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
