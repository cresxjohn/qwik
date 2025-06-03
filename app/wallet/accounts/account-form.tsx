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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  Account,
  AccountType,
  LoanType,
  InsurancePolicyType,
} from "@/shared/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

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

const loanTypes: { value: LoanType; label: string }[] = [
  { value: "mortgage", label: "Mortgage" },
  { value: "auto", label: "Auto Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "student", label: "Student Loan" },
  { value: "business", label: "Business Loan" },
  { value: "other", label: "Other" },
];

const insurancePolicyTypes: { value: InsurancePolicyType; label: string }[] = [
  { value: "life", label: "Life Insurance" },
  { value: "health", label: "Health Insurance" },
  { value: "auto", label: "Auto Insurance" },
  { value: "home", label: "Home Insurance" },
  { value: "renters", label: "Renters Insurance" },
  { value: "disability", label: "Disability Insurance" },
  { value: "other", label: "Other" },
];

const frequencyOptions = [
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Semi-annually", label: "Semi-annually" },
  { value: "Yearly", label: "Yearly" },
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

    // Credit fields
    creditLimit: initialData?.creditLimit?.toString() || "",
    onHoldAmount: initialData?.onHoldAmount?.toString() || "",

    // Credit Card fields
    statementDate: initialData?.statementDate?.toString() || "",
    daysDueAfterStatementDate:
      initialData?.daysDueAfterStatementDate?.toString() || "",
    annualFee: initialData?.annualFee?.toString() || "",
    afWaiverSpendingRequirement:
      initialData?.afWaiverSpendingRequirement?.toString() || "",

    // Interest fields
    interestRate: initialData?.interestRate?.toString() || "",
    interestFrequency: initialData?.interestFrequency || "",

    // Loan fields
    originalLoanAmount: initialData?.originalLoanAmount?.toString() || "",
    monthlyPaymentAmount: initialData?.monthlyPaymentAmount?.toString() || "",
    loanStartDate: initialData?.loanStartDate
      ? new Date(initialData.loanStartDate)
      : undefined,
    maturityDate: initialData?.maturityDate
      ? new Date(initialData.maturityDate)
      : undefined,
    loanTermMonths: initialData?.loanTermMonths?.toString() || "",
    loanType: initialData?.loanType || ("" as LoanType),

    // Insurance fields
    policyType: initialData?.policyType || ("" as InsurancePolicyType),
    premiumAmount: initialData?.premiumAmount?.toString() || "",
    premiumFrequency: initialData?.premiumFrequency || "",
    coverageAmount: initialData?.coverageAmount?.toString() || "",
    policyStartDate: initialData?.policyStartDate
      ? new Date(initialData.policyStartDate)
      : undefined,
    policyEndDate: initialData?.policyEndDate
      ? new Date(initialData.policyEndDate)
      : undefined,

    // Optional fields
    bankInstitution: initialData?.bankInstitution || "",
    accountNumber: initialData?.accountNumber || "",
    minimumBalance: initialData?.minimumBalance?.toString() || "",
    monthlyMaintenanceFee: initialData?.monthlyMaintenanceFee?.toString() || "",

    // System fields
    excludeFromBalances: initialData?.excludeFromBalances || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return "Account name is required";
    }

    if (!formData.type) {
      return "Account type is required";
    }

    // Type-specific validation
    if (formData.type === "loan") {
      if (
        !formData.originalLoanAmount ||
        parseFloat(formData.originalLoanAmount) <= 0
      ) {
        return "Original loan amount is required for loan accounts";
      }
      if (
        !formData.monthlyPaymentAmount ||
        parseFloat(formData.monthlyPaymentAmount) <= 0
      ) {
        return "Monthly payment amount is required for loan accounts";
      }
      if (!formData.loanType) {
        return "Loan type is required for loan accounts";
      }
    }

    if (formData.type === "insurance") {
      if (!formData.policyType) {
        return "Policy type is required for insurance accounts";
      }
      if (!formData.premiumAmount || parseFloat(formData.premiumAmount) <= 0) {
        return "Premium amount is required for insurance accounts";
      }
      if (!formData.premiumFrequency) {
        return "Premium frequency is required for insurance accounts";
      }
    }

    if (
      (formData.type === "credit card" || formData.type === "line of credit") &&
      formData.creditLimit
    ) {
      if (parseFloat(formData.creditLimit) <= 0) {
        return "Credit limit must be greater than 0";
      }
    }

    // Date validation
    if (formData.loanStartDate && formData.maturityDate) {
      if (formData.maturityDate <= formData.loanStartDate) {
        return "Maturity date must be after loan start date";
      }
    }

    if (formData.policyStartDate && formData.policyEndDate) {
      if (formData.policyEndDate <= formData.policyStartDate) {
        return "Policy end date must be after start date";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const accountData: Omit<Account, "id" | "remainingCreditLimit"> = {
        name: formData.name.trim(),
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,

        // Credit fields
        creditLimit: formData.creditLimit
          ? parseFloat(formData.creditLimit)
          : null,
        onHoldAmount: parseFloat(formData.onHoldAmount) || 0,

        // Credit Card fields
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

        // Interest fields
        interestRate: formData.interestRate
          ? parseFloat(formData.interestRate)
          : null,
        interestFrequency: formData.interestFrequency || null,

        // Loan fields
        originalLoanAmount: formData.originalLoanAmount
          ? parseFloat(formData.originalLoanAmount)
          : null,
        monthlyPaymentAmount: formData.monthlyPaymentAmount
          ? parseFloat(formData.monthlyPaymentAmount)
          : null,
        loanStartDate: formData.loanStartDate
          ? dayjs(formData.loanStartDate).toISOString()
          : null,
        maturityDate: formData.maturityDate
          ? dayjs(formData.maturityDate).toISOString()
          : null,
        loanTermMonths: formData.loanTermMonths
          ? parseInt(formData.loanTermMonths)
          : null,
        loanType: formData.loanType || null,

        // Insurance fields
        policyType: formData.policyType || null,
        premiumAmount: formData.premiumAmount
          ? parseFloat(formData.premiumAmount)
          : null,
        premiumFrequency: formData.premiumFrequency || null,
        coverageAmount: formData.coverageAmount
          ? parseFloat(formData.coverageAmount)
          : null,
        policyStartDate: formData.policyStartDate
          ? dayjs(formData.policyStartDate).toISOString()
          : null,
        policyEndDate: formData.policyEndDate
          ? dayjs(formData.policyEndDate).toISOString()
          : null,

        // Optional fields
        bankInstitution: formData.bankInstitution.trim() || null,
        accountNumber: formData.accountNumber.trim() || null,
        minimumBalance: formData.minimumBalance
          ? parseFloat(formData.minimumBalance)
          : null,
        monthlyMaintenanceFee: formData.monthlyMaintenanceFee
          ? parseFloat(formData.monthlyMaintenanceFee)
          : null,

        // System fields
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
  const isLoanType = formData.type === "loan";
  const isInsuranceType = formData.type === "insurance";
  const showInterestFields = isCreditType || isSavingsType || isLoanType;

  // Helper function to render date picker
  const renderDatePicker = (
    label: string,
    value: Date | undefined,
    onChange: (date: Date | undefined) => void,
    placeholder: string,
    description: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? dayjs(value).format("MMM D, YYYY") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col h-full">
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Account Type Tabs */}
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

          {/* Basic Fields */}
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
            <Label htmlFor="balance">
              {isLoanType ? "Remaining Balance" : "Current Balance"}
              {(isLoanType || isInsuranceType) && " *"}
            </Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: e.target.value })
              }
              placeholder="0.00"
              required={isLoanType || isInsuranceType}
            />
            <p className="text-sm text-muted-foreground">
              {isLoanType
                ? "Amount still owed on the loan"
                : isInsuranceType
                ? "Cash value or total premiums paid"
                : "Current account balance (use negative for credit balances)"}
            </p>
          </div>

          {/* Type-specific essential fields */}
          {isLoanType && (
            <>
              <div className="space-y-2">
                <Label htmlFor="originalLoanAmount">
                  Original Loan Amount *
                </Label>
                <Input
                  id="originalLoanAmount"
                  type="number"
                  step="0.01"
                  value={formData.originalLoanAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      originalLoanAmount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Initial amount borrowed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyPaymentAmount">Monthly Payment *</Label>
                <Input
                  id="monthlyPaymentAmount"
                  type="number"
                  step="0.01"
                  value={formData.monthlyPaymentAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthlyPaymentAmount: e.target.value,
                    })
                  }
                  placeholder="0.00"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Required monthly payment amount
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanType">Loan Type *</Label>
                <Select
                  value={formData.loanType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, loanType: value as LoanType })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loanTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Category of loan for tracking purposes
                </p>
              </div>
            </>
          )}

          {isInsuranceType && (
            <>
              <div className="space-y-2">
                <Label htmlFor="policyType">Policy Type *</Label>
                <Select
                  value={formData.policyType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      policyType: value as InsurancePolicyType,
                    })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {insurancePolicyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Type of insurance coverage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="premiumAmount">Premium Amount *</Label>
                <Input
                  id="premiumAmount"
                  type="number"
                  step="0.01"
                  value={formData.premiumAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, premiumAmount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Amount paid per premium period
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="premiumFrequency">Premium Frequency *</Label>
                <Select
                  value={formData.premiumFrequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, premiumFrequency: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How often premiums are paid
                </p>
              </div>
            </>
          )}

          {isCreditType && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  value={formData.creditLimit || undefined}
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
                  value={formData.onHoldAmount || undefined}
                  onChange={(e) =>
                    setFormData({ ...formData, onHoldAmount: e.target.value })
                  }
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground">
                  Amount temporarily held or pending transactions
                </p>
              </div>
            </>
          )}

          {showInterestFields && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate || undefined}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRate: e.target.value })
                  }
                  placeholder="e.g., 3.50"
                />
                <p className="text-sm text-muted-foreground">
                  {isSavingsType
                    ? "Annual percentage yield earned on your balance"
                    : isLoanType
                    ? "Annual percentage rate on the loan"
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
                    {frequencyOptions.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How often interest is calculated and applied
                </p>
              </div>
            </>
          )}

          {/* Advanced Section */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                type="button"
              >
                Advanced Options
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Credit Card specific advanced fields */}
              {formData.type === "credit card" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="statementDate">Statement Date</Label>
                    <Input
                      id="statementDate"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.statementDate || undefined}
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
                      value={formData.daysDueAfterStatementDate || undefined}
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
                      value={formData.annualFee || undefined}
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
                      value={formData.afWaiverSpendingRequirement || undefined}
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

              {/* Loan advanced fields */}
              {isLoanType && (
                <>
                  {renderDatePicker(
                    "Loan Start Date",
                    formData.loanStartDate,
                    (date) => setFormData({ ...formData, loanStartDate: date }),
                    "Select start date",
                    "When the loan was originated"
                  )}

                  {renderDatePicker(
                    "Maturity Date",
                    formData.maturityDate,
                    (date) => setFormData({ ...formData, maturityDate: date }),
                    "Select maturity date",
                    "When the loan will be fully paid off"
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="loanTermMonths">Loan Term (Months)</Label>
                    <Input
                      id="loanTermMonths"
                      type="number"
                      min="1"
                      value={formData.loanTermMonths || undefined}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          loanTermMonths: e.target.value,
                        })
                      }
                      placeholder="e.g., 360"
                    />
                    <p className="text-sm text-muted-foreground">
                      Total loan term in months
                    </p>
                  </div>
                </>
              )}

              {/* Insurance advanced fields */}
              {isInsuranceType && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="coverageAmount">Coverage Amount</Label>
                    <Input
                      id="coverageAmount"
                      type="number"
                      step="0.01"
                      value={formData.coverageAmount || undefined}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coverageAmount: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum coverage or benefit amount
                    </p>
                  </div>

                  {renderDatePicker(
                    "Policy Start Date",
                    formData.policyStartDate,
                    (date) =>
                      setFormData({ ...formData, policyStartDate: date }),
                    "Select start date",
                    "When the policy became effective"
                  )}

                  {renderDatePicker(
                    "Policy End Date",
                    formData.policyEndDate,
                    (date) => setFormData({ ...formData, policyEndDate: date }),
                    "Select end date",
                    "When the policy expires (if applicable)"
                  )}
                </>
              )}

              {/* Optional fields for all types */}
              <div className="space-y-2">
                <Label htmlFor="bankInstitution">Bank/Institution</Label>
                <Input
                  id="bankInstitution"
                  value={formData.bankInstitution}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankInstitution: e.target.value,
                    })
                  }
                  placeholder="e.g., Bank of the Philippine Islands"
                />
                <p className="text-sm text-muted-foreground">
                  Name of the financial institution
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">
                  Account Number (Last 4 digits)
                </Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                  placeholder="e.g., 1234"
                  maxLength={4}
                />
                <p className="text-sm text-muted-foreground">
                  Last 4 digits for identification (security purposes)
                </p>
              </div>

              {(isSavingsType || formData.type === "cash") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="minimumBalance">Minimum Balance</Label>
                    <Input
                      id="minimumBalance"
                      type="number"
                      step="0.01"
                      value={formData.minimumBalance || undefined}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimumBalance: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum balance required to avoid fees
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyMaintenanceFee">
                      Monthly Maintenance Fee
                    </Label>
                    <Input
                      id="monthlyMaintenanceFee"
                      type="number"
                      step="0.01"
                      value={formData.monthlyMaintenanceFee || undefined}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyMaintenanceFee: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Monthly fee charged for maintaining the account
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
            </CollapsibleContent>
          </Collapsible>
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
