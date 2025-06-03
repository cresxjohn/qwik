"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAccountsStore } from "@/store/accounts";
import { toast } from "sonner";
import {
  Account,
  AccountType,
  LoanType,
  InsurancePolicyType,
} from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface ImportSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

const REQUIRED_FIELDS = ["name", "balance", "type"] as const;

export function ImportSheet({ open, onOpenChange }: ImportSheetProps) {
  const { addAccount } = useAccountsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<Account[] | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const template = [
      "name,balance,type,creditLimit,onHoldAmount,statementDate,daysDueAfterStatementDate,annualFee,afWaiverSpendingRequirement,interestRate,interestFrequency,originalLoanAmount,monthlyPaymentAmount,loanStartDate,maturityDate,loanTermMonths,loanType,policyType,premiumAmount,premiumFrequency,coverageAmount,policyStartDate,policyEndDate,bankInstitution,accountNumber,minimumBalance,monthlyMaintenanceFee,excludeFromBalances",
      "RCBC Flex Gold,15000.00,savings,,,,,,,3.00,yearly,,,,,,,,,,,,,RCBC,,2000.00,,false",
      "Security Bank Wave Card,-8500.00,credit card,25000.00,0,15,25,3500.00,120000.00,24.00,yearly,,,,,,,,,,,,,Security Bank,1234,,,false",
      "BPI Family Checking,25000.00,cash,,,,,,,,,,,,,,,,,,,,,BPI,5678,5000.00,300.00,false",
      "Own Bank Credit Line,-12000.00,line of credit,50000.00,2500.00,,,,,18.50,yearly,,,,,,,,,,,,,Own Bank,9012,,,false",
      "Home Mortgage,850000.00,loan,,,,,,,4.25,yearly,1000000.00,15000.00,2024-01-15,2049-01-15,300,mortgage,,,,,,,XYZ Bank,3456,,,false",
      "Life Insurance,25000.00,insurance,,,,,,,,,,,,,,,life,5000.00,yearly,1000000.00,2024-01-01,2034-01-01,ABC Insurance,7890,,,false",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accounts-template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const validateRow = (
    row: Record<string, string>,
    index: number
  ): string[] => {
    const errors: string[] = [];

    // Check if row is empty (all fields are empty)
    const hasAnyValue = Object.values(row).some((value) => value.trim() !== "");
    if (!hasAnyValue) {
      return []; // Skip empty rows silently
    }

    // Check required fields
    REQUIRED_FIELDS.forEach((field) => {
      if (!row[field]?.trim()) {
        errors.push(`Row ${index + 1}: ${field} is required`);
      }
    });

    // Validate balance
    if (row.balance && isNaN(Number(row.balance))) {
      errors.push(`Row ${index + 1}: balance must be a number`);
    }

    // Validate account type
    const validTypes: AccountType[] = [
      "cash",
      "savings",
      "credit card",
      "line of credit",
      "loan",
      "insurance",
    ];
    if (row.type && !validTypes.includes(row.type as AccountType)) {
      errors.push(
        `Row ${index + 1}: type must be one of: ${validTypes.join(", ")}`
      );
    }

    // Validate numeric fields
    const numericFields = [
      "creditLimit",
      "onHoldAmount",
      "statementDate",
      "daysDueAfterStatementDate",
      "annualFee",
      "afWaiverSpendingRequirement",
      "interestRate",
      "originalLoanAmount",
      "monthlyPaymentAmount",
      "loanTermMonths",
      "premiumAmount",
      "coverageAmount",
      "minimumBalance",
      "monthlyMaintenanceFee",
    ];

    numericFields.forEach((field) => {
      if (row[field] && row[field].trim() !== "" && isNaN(Number(row[field]))) {
        errors.push(`Row ${index + 1}: ${field} must be a number`);
      }
    });

    // Validate date fields (YYYY-MM-DD format)
    const dateFields = [
      "loanStartDate",
      "maturityDate",
      "policyStartDate",
      "policyEndDate",
    ];
    dateFields.forEach((field) => {
      if (row[field] && row[field].trim() !== "") {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row[field])) {
          errors.push(
            `Row ${index + 1}: ${field} must be in YYYY-MM-DD format`
          );
        }
      }
    });

    // Validate loan type
    const validLoanTypes = [
      "mortgage",
      "auto",
      "personal",
      "student",
      "business",
      "other",
    ];
    if (row.loanType && !validLoanTypes.includes(row.loanType)) {
      errors.push(
        `Row ${index + 1}: loanType must be one of: ${validLoanTypes.join(
          ", "
        )}`
      );
    }

    // Validate insurance policy type
    const validPolicyTypes = [
      "life",
      "health",
      "auto",
      "home",
      "renters",
      "disability",
      "other",
    ];
    if (row.policyType && !validPolicyTypes.includes(row.policyType)) {
      errors.push(
        `Row ${index + 1}: policyType must be one of: ${validPolicyTypes.join(
          ", "
        )}`
      );
    }

    // Validate frequency fields
    const validFrequencies = [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "yearly",
    ];
    if (
      row.interestFrequency &&
      !validFrequencies.includes(row.interestFrequency.toLowerCase())
    ) {
      errors.push(
        `Row ${
          index + 1
        }: interestFrequency must be one of: ${validFrequencies.join(", ")}`
      );
    }
    if (
      row.premiumFrequency &&
      !validFrequencies.includes(row.premiumFrequency.toLowerCase())
    ) {
      errors.push(
        `Row ${
          index + 1
        }: premiumFrequency must be one of: ${validFrequencies.join(", ")}`
      );
    }

    // Validate boolean fields
    if (
      row.excludeFromBalances &&
      !["true", "false"].includes(row.excludeFromBalances.toLowerCase())
    ) {
      errors.push(
        `Row ${index + 1}: excludeFromBalances must be true or false`
      );
    }

    // Validate account number length
    if (row.accountNumber && row.accountNumber.length > 4) {
      errors.push(
        `Row ${
          index + 1
        }: accountNumber must be 4 characters or less (last 4 digits only)`
      );
    }

    // Validate positive amounts
    const positiveAmountFields = [
      "originalLoanAmount",
      "premiumAmount",
      "coverageAmount",
    ];
    positiveAmountFields.forEach((field) => {
      if (row[field] && row[field].trim() !== "" && Number(row[field]) <= 0) {
        errors.push(`Row ${index + 1}: ${field} must be greater than 0`);
      }
    });

    // Validate non-negative amounts
    const nonNegativeAmountFields = [
      "monthlyPaymentAmount",
      "minimumBalance",
      "monthlyMaintenanceFee",
      "interestRate",
    ];
    nonNegativeAmountFields.forEach((field) => {
      if (row[field] && row[field].trim() !== "" && Number(row[field]) < 0) {
        errors.push(`Row ${index + 1}: ${field} must be 0 or greater`);
      }
    });

    // Validate statement date range (1-31)
    if (row.statementDate && row.statementDate.trim() !== "") {
      const statementDate = Number(row.statementDate);
      if (statementDate < 1 || statementDate > 31) {
        errors.push(`Row ${index + 1}: statementDate must be between 1 and 31`);
      }
    }

    // Validate loan term months (must be positive)
    if (row.loanTermMonths && row.loanTermMonths.trim() !== "") {
      const loanTerm = Number(row.loanTermMonths);
      if (loanTerm <= 0) {
        errors.push(`Row ${index + 1}: loanTermMonths must be greater than 0`);
      }
    }

    // Validate date order for loans
    if (row.loanStartDate && row.maturityDate) {
      const startDate = new Date(row.loanStartDate);
      const endDate = new Date(row.maturityDate);
      if (endDate <= startDate) {
        errors.push(
          `Row ${index + 1}: maturityDate must be after loanStartDate`
        );
      }
    }

    // Validate date order for insurance policies
    if (row.policyStartDate && row.policyEndDate) {
      const startDate = new Date(row.policyStartDate);
      const endDate = new Date(row.policyEndDate);
      if (endDate <= startDate) {
        errors.push(
          `Row ${index + 1}: policyEndDate must be after policyStartDate`
        );
      }
    }

    return errors;
  };

  const handleFile = useCallback(
    () => async (file: File) => {
      if (!file) return;
      if (file.type !== "text/csv") {
        setError("Please upload a CSV file");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setProcessingStatus("Processing your file...");

        const text = await file.text();
        const allRows = text.split("\n").map((row) => row.trim());

        // Filter out completely empty rows and rows with only commas
        const rows = allRows.filter((row) => {
          const trimmedRow = row.trim();
          return (
            trimmedRow !== "" &&
            trimmedRow.split(",").some((cell) => cell.trim() !== "")
          );
        });

        if (rows.length < 2) {
          throw new Error(
            "File must contain at least a header row and one data row"
          );
        }

        // Update status if empty rows were removed
        const emptyRowsCount = allRows.length - rows.length;
        if (emptyRowsCount > 0) {
          setProcessingStatus(
            `Skipped ${emptyRowsCount} empty row${
              emptyRowsCount === 1 ? "" : "s"
            }`
          );
        }

        // Update status for large files
        if (rows.length > 100) {
          setProcessingStatus(
            "Processing large file, this might take a moment..."
          );
        }

        const headers = rows[0].split(",").map((h) => h.trim());
        const dataRows = rows.slice(1);

        // Validate headers
        const missingHeaders = REQUIRED_FIELDS.filter(
          (field) => !headers.includes(field)
        );
        if (missingHeaders.length > 0) {
          throw new Error(
            `Missing required headers: ${missingHeaders.join(", ")}`
          );
        }

        // Process in chunks for large datasets
        const chunkSize = 100;
        const validAccounts: Account[] = [];
        const errors: string[] = [];

        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows.slice(i, i + chunkSize);

          // Update progress for large files
          if (dataRows.length > 100) {
            const progress = Math.round((i / dataRows.length) * 100);
            setProcessingStatus(`Processing... ${progress}% complete`);
          }

          chunk.forEach((row, index) => {
            // Skip rows that are just whitespace or only contain commas
            if (
              !row.trim() ||
              row.split(",").every((cell) => cell.trim() === "")
            ) {
              return;
            }

            const values = row.split(",").map((v) => v.trim());

            // Check if row has correct number of columns
            if (values.length !== headers.length) {
              errors.push(
                `Row ${i + index + 1}: Invalid number of columns. Expected ${
                  headers.length
                }, got ${values.length}`
              );
              return;
            }

            const rowData: Record<string, string> = {};
            headers.forEach((header, i) => {
              rowData[header] = values[i] || "";
            });

            // Skip if all required fields are empty
            const hasRequiredFields = REQUIRED_FIELDS.some((field) =>
              rowData[field]?.trim()
            );
            if (!hasRequiredFields) return;

            const rowErrors = validateRow(rowData, i + index);
            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
              return;
            }

            // Parse numeric values
            const parseNumeric = (value: string) => {
              if (!value || value.trim() === "") return null;
              return Number(value);
            };

            const balance = Number(rowData.balance);
            const creditLimit = parseNumeric(rowData.creditLimit);
            const onHoldAmount = Number(rowData.onHoldAmount || "0");

            // Calculate remaining credit limit
            const remainingCreditLimit = creditLimit
              ? creditLimit + balance - onHoldAmount
              : null;

            validAccounts.push({
              id: crypto.randomUUID(),
              name: rowData.name,
              balance,
              type: rowData.type as AccountType,
              creditLimit,
              onHoldAmount,
              remainingCreditLimit,
              statementDate: parseNumeric(rowData.statementDate),
              daysDueAfterStatementDate: parseNumeric(
                rowData.daysDueAfterStatementDate
              ),
              annualFee: parseNumeric(rowData.annualFee),
              afWaiverSpendingRequirement: parseNumeric(
                rowData.afWaiverSpendingRequirement
              ),
              interestRate: parseNumeric(rowData.interestRate),
              interestFrequency: rowData.interestFrequency || null,
              // Loan fields
              originalLoanAmount: parseNumeric(rowData.originalLoanAmount),
              monthlyPaymentAmount: parseNumeric(rowData.monthlyPaymentAmount),
              loanStartDate: rowData.loanStartDate || null,
              maturityDate: rowData.maturityDate || null,
              loanTermMonths: parseNumeric(rowData.loanTermMonths),
              loanType: (rowData.loanType as LoanType) || null,
              // Insurance fields
              policyType: (rowData.policyType as InsurancePolicyType) || null,
              premiumAmount: parseNumeric(rowData.premiumAmount),
              premiumFrequency: rowData.premiumFrequency || null,
              coverageAmount: parseNumeric(rowData.coverageAmount),
              policyStartDate: rowData.policyStartDate || null,
              policyEndDate: rowData.policyEndDate || null,
              // Bank and optional fields
              bankInstitution: rowData.bankInstitution || null,
              accountNumber: rowData.accountNumber || null,
              minimumBalance: parseNumeric(rowData.minimumBalance),
              monthlyMaintenanceFee: parseNumeric(
                rowData.monthlyMaintenanceFee
              ),
              excludeFromBalances:
                rowData.excludeFromBalances?.toLowerCase() === "true" || false,
            });
          });
        }

        if (errors.length > 0) {
          setError(errors.join("\n"));
          setProcessingStatus(null);
          return;
        }

        setPreviewData(validAccounts);
        setShowGuide(false);
        setProcessingStatus(null);
      } catch (error) {
        console.error("Error processing accounts:", error);
        setError(
          error instanceof Error ? error.message : "Failed to process accounts"
        );
        setProcessingStatus(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleImport = () => {
    if (!previewData) return;

    setLoading(true);
    setProcessingStatus(`Importing ${previewData.length} accounts...`);

    try {
      // Import in chunks for large datasets
      const chunkSize = 50;
      let imported = 0;

      for (let i = 0; i < previewData.length; i += chunkSize) {
        const chunk = previewData.slice(i, i + chunkSize);

        chunk.forEach((account) => {
          // Remove id and remainingCreditLimit as they should be handled by the API
          const { id, remainingCreditLimit, ...accountData } = account;
          addAccount(accountData);
          imported++;
        });

        // Update progress for large imports
        if (previewData.length > 100) {
          const progress = Math.round((imported / previewData.length) * 100);
          setProcessingStatus(`Importing... ${progress}% complete`);
        }
      }

      toast.success(`Successfully imported ${previewData.length} accounts`);

      // Reset form state
      setPreviewData(null);
      setShowGuide(true);
      setError(null);
      setProcessingStatus(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error importing accounts:", error);
      setError(
        error instanceof Error ? error.message : "Failed to import accounts"
      );
      setProcessingStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.[0]) {
        handleFile()(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-screen md:max-w-[600px] flex flex-col p-0 gap-0">
        <SheetHeader className="p-4">
          <SheetTitle>Import Accounts</SheetTitle>
          <SheetDescription className="text-base">
            {previewData
              ? `Review ${previewData.length} accounts before importing`
              : "Import multiple accounts from a CSV file."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {!previewData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Upload CSV File</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="h-8"
                  >
                    Download Template
                  </Button>
                </div>

                <div
                  className={cn(
                    "relative rounded-lg border-2 border-dashed p-8 transition-colors",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25",
                    loading && "opacity-50"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile()(e.target.files[0])
                    }
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium">Click to upload</span> or
                      drag and drop
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Upload your CSV file - we&apos;ll validate the data before
                      importing
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">{error}</div>
                  </div>
                )}

                {showGuide && (
                  <div className="rounded-lg border bg-card">
                    <div className="px-4 py-3 border-b">
                      <h3 className="font-semibold">CSV Format Guide</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quick guide to prepare your CSV file with examples and
                        validation rules.
                      </p>
                    </div>
                    <div className="divide-y">
                      <div className="px-4 py-3">
                        <h4 className="text-sm font-semibold mb-3 flex items-center">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs mr-2">
                            1
                          </span>
                          Required Fields
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          These fields are required for each account. Our
                          template includes them all.
                        </p>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                name
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Account name (e.g., RCBC Flex Gold)
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                balance
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Current balance in Peso (e.g., 15000.00,
                                -8500.00)
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                type
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Account type (cash, savings, credit card, loan,
                                etc.)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <h4 className="text-sm font-semibold mb-3 flex items-center">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs mr-2">
                            2
                          </span>
                          Account Types & Credit Fields
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Specify account type and credit-related information.
                        </p>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                creditLimit
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Credit limit in Peso for credit accounts
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                onHoldAmount
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Amount on hold (defaults to 0)
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                annualFee
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Annual fee in Peso
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                statementDate
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Statement date (day 1-31)
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                interestRate
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Interest rate percentage
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <h4 className="text-sm font-semibold mb-3 flex items-center">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs mr-2">
                            3
                          </span>
                          Loan Fields
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          For loan accounts, specify loan details and payment
                          information.
                        </p>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                originalLoanAmount
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Original loan amount in Peso
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                monthlyPaymentAmount
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Monthly payment in Peso
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                loanStartDate
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Start date (YYYY-MM-DD)
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                maturityDate
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Maturity date (YYYY-MM-DD)
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                loanTermMonths
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Term in months
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                loanType
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Type: mortgage, auto, personal, etc.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <h4 className="text-sm font-semibold mb-3 flex items-center">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs mr-2">
                            4
                          </span>
                          Insurance Fields
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          For insurance accounts, specify policy details and
                          premium information.
                        </p>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                policyType
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Type: life, health, auto, home, etc.
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                premiumAmount
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Premium amount in Peso
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                coverageAmount
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Coverage amount in Peso
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                premiumFrequency
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Payment frequency (monthly, yearly, etc.)
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                policyStartDate
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Start date (YYYY-MM-DD)
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                policyEndDate
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                End date (YYYY-MM-DD)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <h4 className="text-sm font-semibold mb-3 flex items-center">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs mr-2">
                            5
                          </span>
                          Bank & Optional Fields
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Additional information for better account management.
                        </p>
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                bankInstitution
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Bank or financial institution name
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                accountNumber
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Last 4 digits only (for security)
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                minimumBalance
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                Minimum balance requirement in Peso
                              </p>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                excludeFromBalances
                              </code>
                              <p className="text-muted-foreground text-xs mt-1">
                                true/false to exclude from total calculations
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        <h4 className="text-sm font-semibold mb-3 flex items-center">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs mr-2">
                            6
                          </span>
                          Examples & Validation
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Detailed examples for different account types and validation rules to ensure successful import.
                        </p>

                        <Accordion
                          type="single"
                          collapsible
                          className="w-full space-y-4"
                        >
                          <AccordionItem
                            value="savings"
                            className="border rounded-lg"
                          >
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                Savings Account
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-3">
                                  <h5 className="font-medium mb-2">
                                    High-Yield Savings Account
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    Use this format for savings accounts with interest-bearing features.
                                    Perfect for emergency funds, high-yield savings, or any deposit account
                                    that earns interest over time.
                                  </p>
                                  <div className="mt-2 text-sm">
                                    <strong>Example:</strong> RCBC Flex Gold savings account with ₱15,000 balance
                                  </div>
                                </div>
                                <div className="rounded-md border overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b bg-muted/50">
                                        <th className="text-left px-3 py-2 font-medium">
                                          Field
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium">
                                          Value
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          name
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          RCBC Flex Gold
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          balance
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          15000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          type
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          savings
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          interestRate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          3.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          interestFrequency
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          yearly
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          bankInstitution
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          RCBC
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          minimumBalance
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          2000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          excludeFromBalances
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          false
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem
                            value="credit"
                            className="border rounded-lg"
                          >
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                Credit Card Account
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-3">
                                  <h5 className="font-medium mb-2">
                                    Credit Card with Outstanding Balance
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    Use this format for credit cards with credit limits, statement dates,
                                    and payment due dates. Balance should be negative to represent debt.
                                  </p>
                                  <div className="mt-2 text-sm">
                                    <strong>Example:</strong> Security Bank Wave Card with ₱8,500 outstanding balance
                                  </div>
                                </div>
                                <div className="rounded-md border overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b bg-muted/50">
                                        <th className="text-left px-3 py-2 font-medium">
                                          Field
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium">
                                          Value
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          name
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          Security Bank Wave Card
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          balance
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          -8500.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          type
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          credit card
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          creditLimit
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          25000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          statementDate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          15
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          daysDueAfterStatementDate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          25
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          annualFee
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          3500.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          interestRate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          24.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          bankInstitution
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          Security Bank
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          accountNumber
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          1234
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="loan" className="border rounded-lg">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                Loan Account
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-3">
                                  <h5 className="font-medium mb-2">
                                    Home Mortgage Loan
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    Use this format for mortgages, auto loans, personal loans, or any
                                    debt with structured payment terms. Include loan details like
                                    original amount, payment schedule, and maturity date.
                                  </p>
                                  <div className="mt-2 text-sm">
                                    <strong>Example:</strong> 25-year home mortgage of ₱1,000,000 with ₱850,000 remaining
                                  </div>
                                </div>
                                <div className="rounded-md border overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b bg-muted/50">
                                        <th className="text-left px-3 py-2 font-medium">
                                          Field
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium">
                                          Value
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          name
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          Home Mortgage
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          balance
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          850000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          type
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          loan
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          originalLoanAmount
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          1000000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          monthlyPaymentAmount
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          15000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          interestRate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          4.25
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          loanStartDate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          2024-01-15
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          maturityDate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          2049-01-15
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          loanTermMonths
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          300
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          loanType
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          mortgage
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          bankInstitution
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          XYZ Bank
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="insurance" className="border rounded-lg">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                Insurance Account
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-3">
                                  <h5 className="font-medium mb-2">
                                    Life Insurance Policy
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    Use this format for insurance policies with cash values, premium
                                    payments, and coverage amounts. Balance represents current cash value
                                    or accumulated premiums paid.
                                  </p>
                                  <div className="mt-2 text-sm">
                                    <strong>Example:</strong> ₱1,000,000 life insurance policy with ₱25,000 cash value
                                  </div>
                                </div>
                                <div className="rounded-md border overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b bg-muted/50">
                                        <th className="text-left px-3 py-2 font-medium">
                                          Field
                                        </th>
                                        <th className="text-left px-3 py-2 font-medium">
                                          Value
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          name
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          Life Insurance
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          balance
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          25000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          type
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          insurance
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          policyType
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          life
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          premiumAmount
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          5000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          premiumFrequency
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          yearly
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          coverageAmount
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          1000000.00
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          policyStartDate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          2024-01-01
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          policyEndDate
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          2034-01-01
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          bankInstitution
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">
                                          ABC Insurance
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="validation" className="border rounded-lg">
                            <AccordionTrigger className="px-4 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                Validation Rules & Common Errors
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                <div className="rounded-lg border bg-orange-50 p-3">
                                  <h5 className="font-medium mb-2 text-orange-800">
                                    Important Validation Rules
                                  </h5>
                                  <p className="text-sm text-orange-700">
                                    Follow these rules to ensure successful account import and avoid common errors.
                                  </p>
                                </div>
                                <div className="space-y-3 text-sm">
                                  <div className="p-3 rounded border border-blue-200 bg-blue-50">
                                    <div className="font-medium text-blue-800 mb-1">
                                      Field Format Requirements
                                    </div>
                                    <div className="text-blue-700 text-xs space-y-1">
                                      <div>
                                        <strong>Account Number:</strong> Maximum 4 characters (last 4 digits only)
                                      </div>
                                      <div>
                                        <strong>Statement Date:</strong> Must be between 1-31 (day of month)
                                      </div>
                                      <div>
                                        <strong>Dates:</strong> Use YYYY-MM-DD format (e.g., 2024-03-22)
                                      </div>
                                      <div>
                                        <strong>Boolean Fields:</strong> Use "true" or "false" (case-insensitive)
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded border border-green-200 bg-green-50">
                                    <div className="font-medium text-green-800 mb-1">
                                      Amount & Balance Rules
                                    </div>
                                    <div className="text-green-700 text-xs space-y-1">
                                      <div>
                                        <strong>Balance:</strong> Can be positive or negative (positive for assets, negative for debts)
                                      </div>
                                      <div>
                                        <strong>Positive Amounts:</strong> originalLoanAmount, premiumAmount, coverageAmount must be > 0
                                      </div>
                                      <div>
                                        <strong>Non-negative:</strong> monthlyPaymentAmount, minimumBalance, fees must be ≥ 0
                                      </div>
                                      <div>
                                        <strong>Format:</strong> Use decimal format (15000.00) not currency symbols
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded border border-yellow-200 bg-yellow-50">
                                    <div className="font-medium text-yellow-800 mb-1">
                                      Date Validation Rules
                                    </div>
                                    <div className="text-yellow-700 text-xs space-y-1">
                                      <div>
                                        <strong>Loan Dates:</strong> maturityDate must be after loanStartDate
                                      </div>
                                      <div>
                                        <strong>Insurance Dates:</strong> policyEndDate must be after policyStartDate
                                      </div>
                                      <div>
                                        <strong>Loan Term:</strong> loanTermMonths must be greater than 0
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-3 rounded border border-purple-200 bg-purple-50">
                                    <div className="font-medium text-purple-800 mb-1">
                                      Account Type Specific Rules
                                    </div>
                                    <div className="text-purple-700 text-xs space-y-1">
                                      <div>
                                        <strong>Loan Type:</strong> mortgage, auto, personal, student, business, other
                                      </div>
                                      <div>
                                        <strong>Policy Type:</strong> life, health, auto, home, renters, disability, other
                                      </div>
                                      <div>
                                        <strong>Frequency:</strong> daily, weekly, monthly, quarterly, yearly
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewData && (
              <div className="rounded-lg border bg-card">
                <div className="px-4 py-3 border-b">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold">Preview Accounts</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Review these accounts before importing. Verify all
                        details are correct.
                      </p>
                    </div>
                  </div>
                </div>
                {processingStatus && (
                  <div className="px-4 py-2 border-b bg-muted/50 text-sm text-muted-foreground">
                    {processingStatus}
                  </div>
                )}
                <div className="divide-y">
                  {previewData.map((account) => (
                    <div key={account.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{account.name}</h4>
                        <div className="text-sm font-mono">
                          {formatCurrency(account.balance)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>{" "}
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {account.type}
                          </Badge>
                        </div>
                        {account.creditLimit && (
                          <div>
                            <span className="text-muted-foreground">
                              Credit Limit:
                            </span>{" "}
                            {formatCurrency(account.creditLimit)}
                          </div>
                        )}
                        {account.bankInstitution && (
                          <div>
                            <span className="text-muted-foreground">Bank:</span>{" "}
                            {account.bankInstitution}
                          </div>
                        )}
                        {account.interestRate && (
                          <div>
                            <span className="text-muted-foreground">
                              Interest Rate:
                            </span>{" "}
                            {account.interestRate.toFixed(2)}%
                            {account.interestFrequency &&
                              ` ${account.interestFrequency}`}
                          </div>
                        )}
                        {account.loanType && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">
                              Loan Type:
                            </span>{" "}
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {account.loanType}
                            </Badge>
                          </div>
                        )}
                        {account.policyType && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">
                              Policy Type:
                            </span>{" "}
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {account.policyType}
                            </Badge>
                          </div>
                        )}
                        {account.originalLoanAmount && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">
                              Original Loan:
                            </span>{" "}
                            {formatCurrency(account.originalLoanAmount)}
                          </div>
                        )}
                        {account.premiumAmount && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">
                              Premium:
                            </span>{" "}
                            {formatCurrency(account.premiumAmount)}
                            {account.premiumFrequency &&
                              ` ${account.premiumFrequency}`}
                          </div>
                        )}
                        {account.excludeFromBalances && (
                          <div className="col-span-2">
                            <Badge variant="outline" className="text-xs">
                              Excluded from balance calculations
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="flex justify-end gap-2 flex-wrap">
            {previewData ? (
              <>
                <Button
                  onClick={handleImport}
                  disabled={loading}
                  className="w-full md:w-auto order-first md:order-last"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading
                    ? "Importing..."
                    : `Import ${previewData.length} Accounts`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewData(null);
                    setShowGuide(true);
                    setError(null);
                  }}
                  disabled={loading}
                  className="w-full md:w-auto order-last md:order-first"
                >
                  Upload Different File
                </Button>
              </>
            ) : (
              <>
                <Button
                  disabled={true}
                  className="w-full md:w-auto order-first md:order-last"
                >
                  Import
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="w-full md:w-auto order-last md:order-first"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
