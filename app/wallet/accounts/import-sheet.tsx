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
import { useAccountsStore } from "@/store/accounts";
import { toast } from "sonner";
import { Account, AccountType } from "@/shared/types";
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
      "name,balance,type,creditLimit,onHoldAmount,statementDate,daysDueAfterStatementDate,annualFee,afWaiverSpendingRequirement,excludeFromBalances,interestRate,interestFrequency",
      "RCBC Flex Gold,15000.00,savings,,,,,,,false,3.00,Yearly",
      "Security Bank Wave Card,-8500.00,credit card,25000.00,0,15,25,3500.00,120000.00,false,24.00,Yearly",
      "BPI Family Checking,25000.00,cash,,,,,,,false,,",
      "Own Bank Credit Line,-12000.00,line of credit,50000.00,2500.00,,,,,false,18.50,Yearly",
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
    ];

    numericFields.forEach((field) => {
      if (row[field] && row[field].trim() !== "" && isNaN(Number(row[field]))) {
        errors.push(`Row ${index + 1}: ${field} must be a number`);
      }
    });

    // Validate boolean fields
    if (
      row.excludeFromBalances &&
      !["true", "false"].includes(row.excludeFromBalances.toLowerCase())
    ) {
      errors.push(
        `Row ${index + 1}: excludeFromBalances must be true or false`
      );
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
              excludeFromBalances:
                rowData.excludeFromBalances?.toLowerCase() === "true" || false,
              interestRate: parseNumeric(rowData.interestRate),
              interestFrequency: rowData.interestFrequency || null,
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
          addAccount(account);
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
              : "Import multiple accounts quickly with a CSV file. Download our template or follow the guide below."}
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
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors flex flex-col items-center",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border",
                    loading && "opacity-50 pointer-events-none"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {loading ? (
                    <div className="space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {processingStatus || "Processing..."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">
                        Drop your CSV file here or{" "}
                        <label className="text-primary cursor-pointer underline">
                          browse
                          <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFile()(file);
                            }}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV files only
                      </p>
                    </>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-800 space-y-1">
                        <p className="font-medium">Import Error</p>
                        <pre className="whitespace-pre-wrap text-xs">
                          {error}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {showGuide && (
                  <div className="w-full space-y-3 border rounded-lg p-4">
                    <h3 className="text-sm font-medium">CSV Format Guide</h3>

                    <div>
                      <h4 className="font-medium mb-2">Required Fields</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          • <code>name</code> - Account name
                        </li>
                        <li>
                          • <code>balance</code> - Current balance (positive for
                          assets, negative for credit balances)
                        </li>
                        <li>
                          • <code>type</code> - Account type: cash, savings,
                          credit card, line of credit, loan, insurance
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Optional Fields</h4>
                      <ul className="space-y-1 text-muted-foreground text-xs">
                        <li>
                          • <code>creditLimit</code> - Credit limit for credit
                          accounts
                        </li>
                        <li>
                          • <code>onHoldAmount</code> - Amount on hold (defaults
                          to 0)
                        </li>
                        <li>
                          • <code>statementDate</code> - Statement date (day of
                          month)
                        </li>
                        <li>
                          • <code>daysDueAfterStatementDate</code> - Payment due
                          days after statement
                        </li>
                        <li>
                          • <code>annualFee</code> - Annual fee amount
                        </li>
                        <li>
                          • <code>afWaiverSpendingRequirement</code> - Annual
                          fee waiver spending requirement
                        </li>
                        <li>
                          • <code>excludeFromBalances</code> - true/false to
                          exclude from balance calculations
                        </li>
                        <li>
                          • <code>interestRate</code> - Interest rate percentage
                        </li>
                        <li>
                          • <code>interestFrequency</code> - Interest frequency
                          (e.g., Yearly, Monthly)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Example</h4>
                      <div className="bg-muted p-3 rounded text-xs font-mono">
                        RCBC Flex Gold,15000.00,savings,,,,,,,false,3.00,Yearly
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Preview</h3>
                    <p className="text-xs text-muted-foreground">
                      {previewData.length} accounts ready to import
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPreviewData(null);
                        setShowGuide(true);
                        setError(null);
                      }}
                    >
                      Back
                    </Button>
                    <Button size="sm" onClick={handleImport} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {processingStatus || "Importing..."}
                        </>
                      ) : (
                        `Import ${previewData.length} Account${
                          previewData.length === 1 ? "" : "s"
                        }`
                      )}
                    </Button>
                  </div>
                </div>

                <div className="overflow-y-auto border rounded-lg">
                  <div className="space-y-2 p-3">
                    {previewData.map((account, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{account.name}</h4>
                            <Badge
                              variant="outline"
                              className="capitalize mt-1"
                            >
                              {account.type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(account.balance)}
                            </p>
                            {account.creditLimit && (
                              <p className="text-xs text-muted-foreground">
                                Credit: {formatCurrency(account.creditLimit)}
                              </p>
                            )}
                          </div>
                        </div>

                        {(account.interestRate ||
                          account.excludeFromBalances) && (
                          <div className="flex gap-2 flex-wrap">
                            {account.interestRate && (
                              <Badge variant="secondary" className="text-xs">
                                {account.interestRate.toFixed(2)}%
                                {account.interestFrequency &&
                                  ` ${account.interestFrequency}`}
                              </Badge>
                            )}
                            {account.excludeFromBalances && (
                              <Badge variant="outline" className="text-xs">
                                Excluded from balances
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
