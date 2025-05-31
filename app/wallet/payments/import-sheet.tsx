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
import { usePaymentsStore } from "@/store/paymentsStore";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Frequency, Payment } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import dayjs from "dayjs";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface ImportSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

const REQUIRED_FIELDS = [
  "name",
  "amount",
  "account",
  "category",
  "startDate",
] as const;

export function ImportSheet({ open, onOpenChange }: ImportSheetProps) {
  const { addPayment } = usePaymentsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<Payment[] | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const template = [
      "name,amount,account,category,startDate,frequency,toAccount,tags,link,endDateType,endDate,numberOfEvents,notes",
      "Netflix,399.00,Checking,Subscriptions,2024-03-22,monthly,,entertainment;streaming,https://netflix.com,forever,,,Monthly streaming subscription",
      "Gym Membership,1149.99,Checking,Memberships,2024-03-22,monthly,,health;fitness,https://gym.com,numberOfEvents,,12,Monthly gym membership for 1 year",
      "Electricity Bill,1290.50,Checking,Utilities,2024-03-22,,,bills;utilities,https://electricity.com,date,2024-04-22,,One-time bill payment",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments-template.csv";
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

    // Validate amount
    if (row.amount && isNaN(Number(row.amount))) {
      errors.push(`Row ${index + 1}: amount must be a number`);
    }

    // Validate dates
    if (row.startDate) {
      const startDate = dayjs(row.startDate.trim(), "YYYY-MM-DD", true);
      if (!startDate.isValid()) {
        errors.push(
          `Row ${
            index + 1
          }: startDate must be a valid date in YYYY-MM-DD format (e.g., 2024-03-22). Got: "${
            row.startDate
          }"`
        );
      }
    }
    if (row.endDate && row.endDateType === "date") {
      const endDate = dayjs(row.endDate.trim(), "YYYY-MM-DD", true);
      if (!endDate.isValid()) {
        errors.push(
          `Row ${
            index + 1
          }: endDate must be a valid date in YYYY-MM-DD format (e.g., 2024-04-22). Got: "${
            row.endDate
          }"`
        );
      }
    }

    // Validate frequency if provided
    if (
      row.frequency &&
      !["weekly", "fortnightly", "monthly", "quarterly", "yearly"].includes(
        row.frequency
      )
    ) {
      errors.push(
        `Row ${
          index + 1
        }: frequency must be one of: weekly, fortnightly, monthly, quarterly, yearly`
      );
    }

    // Validate endDateType and related fields
    if (row.endDateType) {
      if (!["forever", "numberOfEvents", "date"].includes(row.endDateType)) {
        errors.push(
          `Row ${
            index + 1
          }: endDateType must be one of: forever, numberOfEvents, date`
        );
      } else {
        switch (row.endDateType) {
          case "numberOfEvents":
            if (!row.numberOfEvents || isNaN(Number(row.numberOfEvents))) {
              errors.push(
                `Row ${
                  index + 1
                }: numberOfEvents must be a number when endDateType is "numberOfEvents"`
              );
            }
            break;
          case "date":
            if (!row.endDate) {
              errors.push(
                `Row ${
                  index + 1
                }: endDate is required when endDateType is "date"`
              );
            }
            break;
        }
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
        const validPayments: Payment[] = [];
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

            // Convert tags string to array
            const tags = rowData.tags
              ? rowData.tags.split(";").map((t) => t.trim())
              : [];

            // Parse and validate start date
            const startDateObj = dayjs(
              rowData.startDate.trim(),
              "YYYY-MM-DD",
              true
            );
            if (!startDateObj.isValid()) {
              throw new Error(
                `Invalid start date format in row ${
                  i + index + 1
                }. Use YYYY-MM-DD format. Got: "${rowData.startDate}"`
              );
            }
            const startDate = startDateObj.startOf("day").toISOString();
            let endDate: string | undefined;

            // Calculate end date based on endDateType
            if (rowData.endDateType === "date" && rowData.endDate) {
              const endDateObj = dayjs(
                rowData.endDate.trim(),
                "YYYY-MM-DD",
                true
              );
              if (!endDateObj.isValid()) {
                throw new Error(
                  `Invalid end date format in row ${
                    i + index + 1
                  }. Use YYYY-MM-DD format. Got: "${rowData.endDate}"`
                );
              }
              endDate = endDateObj.startOf("day").toISOString();
            } else if (
              rowData.endDateType === "numberOfEvents" &&
              rowData.numberOfEvents &&
              rowData.frequency
            ) {
              const numEvents = parseInt(rowData.numberOfEvents);
              const start = dayjs(startDate, "YYYY-MM-DD");
              switch (rowData.frequency) {
                case "weekly":
                  endDate = start
                    .add(numEvents, "week")
                    .startOf("day")
                    .toISOString();
                  break;
                case "fortnightly":
                  endDate = start
                    .add(numEvents * 2, "week")
                    .startOf("day")
                    .toISOString();
                  break;
                case "monthly":
                  endDate = start
                    .add(numEvents, "month")
                    .startOf("day")
                    .toISOString();
                  break;
                case "quarterly":
                  endDate = start
                    .add(numEvents * 3, "month")
                    .startOf("day")
                    .toISOString();
                  break;
                case "yearly":
                  endDate = start
                    .add(numEvents, "year")
                    .startOf("day")
                    .toISOString();
                  break;
              }
            }

            validPayments.push({
              id: uuidv4(),
              name: rowData.name,
              amount: Number(rowData.amount),
              frequency: rowData.frequency as Frequency | undefined,
              account: rowData.account,
              toAccount: rowData.toAccount || undefined,
              category: rowData.category,
              tags,
              link: rowData.link || undefined,
              startDate,
              endDate,
              notes: rowData.notes || undefined,
              attachments: [],
              recurring: !!rowData.frequency,
              paymentType: "expense",
              paymentDate: startDate,
              lastPaymentDate: startDate,
              nextDueDate: startDate,
            });
          });
        }

        if (errors.length > 0) {
          setError(errors.join("\n"));
          setProcessingStatus(null);
          return;
        }

        setPreviewData(validPayments);
        setShowGuide(false);
        setProcessingStatus(null);
      } catch (error) {
        console.error("Error processing payments:", error);
        setError(
          error instanceof Error ? error.message : "Failed to process payments"
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
    setProcessingStatus(`Importing ${previewData.length} payments...`);

    try {
      // Import in chunks for large datasets
      const chunkSize = 50;
      let imported = 0;

      for (let i = 0; i < previewData.length; i += chunkSize) {
        const chunk = previewData.slice(i, i + chunkSize);

        chunk.forEach((payment) => {
          addPayment(payment);
          imported++;
        });

        // Update progress for large imports
        if (previewData.length > 100) {
          const progress = Math.round((imported / previewData.length) * 100);
          setProcessingStatus(`Importing... ${progress}% complete`);
        }
      }

      toast.success(`Successfully imported ${previewData.length} payments`);

      // Reset form state
      setPreviewData(null);
      setShowGuide(true);
      setError(null);
      setProcessingStatus(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error importing payments:", error);
      setError(
        error instanceof Error ? error.message : "Failed to import payments"
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
          <SheetTitle>Import Payments</SheetTitle>
          <SheetDescription className="text-base">
            {previewData
              ? `Review ${previewData.length} payments before importing`
              : "Import multiple payments quickly with a CSV file. Download our template or follow the guide below."}
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
                      Upload your CSV file here - we&apos;ll help you validate
                      the data before importing
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {previewData && (
              <div className="rounded-lg border bg-card">
                <div className="px-4 py-3 border-b">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold">Preview Payments</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Review these payments before importing. Make sure all
                        the details are correct.
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
                  {previewData.map((payment) => (
                    <div key={payment.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{payment.name}</h4>
                        <div className="text-sm font-mono">
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Account:
                          </span>{" "}
                          {payment.account}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Category:
                          </span>{" "}
                          {payment.category}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Start:</span>{" "}
                          {dayjs(payment.startDate).format("MMM D, YYYY")}
                        </div>
                        {payment.frequency && (
                          <div>
                            <span className="text-muted-foreground">
                              Frequency:
                            </span>{" "}
                            {payment.frequency}
                          </div>
                        )}
                        {payment.endDate && (
                          <div>
                            <span className="text-muted-foreground">End:</span>{" "}
                            {dayjs(payment.endDate).format("MMM D, YYYY")}
                          </div>
                        )}
                        {payment.tags.length > 0 && (
                          <div className="col-span-2">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground">
                                Tags:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {payment.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-muted"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showGuide && (
              <div className="rounded-lg border bg-card">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold">CSV File Format Guide</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Here&apos;s everything you need to know about preparing your
                    CSV file. We&apos;ve broken it down into three simple
                    sections.
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
                      These fields must be included for each payment. Don&apos;t
                      worry - our template includes them all!
                    </p>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            name
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            What&apos;s this payment for? E.g.,
                            &quot;Netflix&quot; or &quot;Gym Membership&quot;
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            amount
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            How much is the payment? Use numbers only, like
                            15.99
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            account
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Which account is this paid from? Use the exact
                            account name
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            category
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Help organize your payments by category (e.g.,
                            &quot;Bills&quot; or &quot;Subscriptions&quot;)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            startDate
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            When does this payment start? Use YYYY-MM-DD format
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
                      Optional Fields
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      These fields add more details to your payments.
                      They&apos;re optional, but they help you track your
                      payments better.
                    </p>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            frequency
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            How often does this payment repeat? Choose from:
                            weekly, fortnightly, monthly, quarterly, or yearly
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            toAccount
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            For transfers: which account receives the money?
                            Leave empty for regular payments
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            tags
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Add multiple tags using semicolons, like:
                            &quot;utilities;home;monthly&quot;
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            link
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Add a website link related to this payment, like
                            your Netflix account page
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            endDateType
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Choose how the payment ends: &quot;forever&quot;
                            (ongoing), &quot;numberOfEvents&quot; (specific
                            number of payments), or &quot;date&quot; (specific
                            end date)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            endDate
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            If endDateType is &quot;date&quot;, when should the
                            payment stop? Use YYYY-MM-DD
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            numberOfEvents
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            If endDateType is &quot;numberOfEvents&quot;, how
                            many times should this payment repeat?
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            notes
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Add any extra details you want to remember about
                            this payment
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
                      Examples
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Here are three common scenarios to help you understand how
                      to structure your CSV data.
                    </p>

                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-4"
                    >
                      <AccordionItem
                        value="forever"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            Ongoing Subscription
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3">
                              <h5 className="font-medium mb-2">
                                Ongoing Subscription
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                Use this format for subscriptions or payments
                                that continue indefinitely until cancelled.
                                Perfect for streaming services, gym memberships,
                                or any recurring payment without a set end date.
                              </p>
                              <div className="mt-2 text-sm">
                                <strong>Example:</strong> Netflix monthly
                                subscription at $15.99
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
                                      Netflix
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      amount
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      15.99
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      account
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Checking
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      category
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Subscriptions
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      startDate
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      2024-03-22
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      frequency
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      monthly
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      tags
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      entertainment;streaming
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      link
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      https://netflix.com
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      endDateType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      forever
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="numberOfEvents"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            Fixed Number of Payments
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3">
                              <h5 className="font-medium mb-2">
                                Fixed Number of Payments
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                Use this format when you know exactly how many
                                times a payment will repeat. Great for
                                fixed-term contracts or installment payments.
                              </p>
                              <div className="mt-2 text-sm">
                                <strong>Example:</strong> 12 monthly gym
                                membership payments at $49.99
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
                                      Gym Membership
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      amount
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      49.99
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      account
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Checking
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      category
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Memberships
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      startDate
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      2024-03-22
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      frequency
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      monthly
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      tags
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      health;fitness
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      link
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      https://gym.com
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      endDateType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      numberOfEvents
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      numberOfEvents
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      12
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="date" className="border rounded-lg">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                            End Date
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3">
                              <h5 className="font-medium mb-2">
                                Specific End Date
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                Use this format when you know the exact date the
                                payment should end. Ideal for fixed-term
                                contracts or payments with a known end date.
                              </p>
                              <div className="mt-2 text-sm">
                                <strong>Example:</strong> One-time electricity
                                bill of $120.50
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
                                      Electricity Bill
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      amount
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      120.50
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      account
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Checking
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      category
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Utilities
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      startDate
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      2024-03-22
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      tags
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      bills;utilities
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      link
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      https://electricity.com
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      endDateType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      date
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      endDate
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      2024-04-22
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
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
                    : `Import ${previewData.length} Payments`}
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
