/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  FrequencyType,
  MonthlyType,
  Payment,
  PaymentConfirmationType,
  PaymentType,
  RecurrencePattern,
} from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import { useAccountsStore } from "@/store/accounts";
import { usePaymentsStore } from "@/store/payments";
import dayjs from "dayjs";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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
  const { items: accounts } = useAccountsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<Payment[] | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const template = [
      "name,amount,account,category,startDate,paymentType,confirmationType,toAccount,tags,link,recurring,frequency,interval,weeklyDays,monthlyType,monthlyDay,monthlyWeek,monthlyWeekDay,endDateType,endDate,numberOfEvents,notes",
      "Netflix,399.00,Cash,Subscriptions,2024-03-22,expense,automatic,,entertainment;streaming,https://netflix.com,true,monthly,1,,,,,,forever,,,Monthly streaming subscription",
      "Salary,75000.00,Cash,Income,2024-03-01,income,automatic,,salary;work,,true,monthly,1,,,1,,,forever,,,Monthly salary deposit",
      "Savings Transfer,5000.00,Cash,Transfers,2024-03-22,transfer,manual,GCash,savings;monthly,,true,monthly,1,,,,,,forever,,,Monthly savings transfer",
      "Gym Membership,1149.99,Cash,Memberships,2024-03-22,expense,automatic,,health;fitness,https://gym.com,true,monthly,1,,,,,,numberOfEvents,,12,Monthly gym membership for 1 year",
      "Electricity Bill,1290.50,Cash,Utilities,2024-03-22,expense,manual,,bills;utilities,https://electricity.com,false,,,,,,,,date,2024-04-22,,One-time bill payment",
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

  const validateRow = useCallback(
    (row: Record<string, string>, index: number): string[] => {
      const errors: string[] = [];

      // Check if row is empty (all fields are empty)
      const hasAnyValue = Object.values(row).some(
        (value) => value.trim() !== ""
      );
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
      if (row.amount) {
        const amount = Number(row.amount);
        if (isNaN(amount)) {
          errors.push(
            `Row ${
              index + 1
            }: amount must be a valid number (e.g., 15.99 or 1500). Got: "${
              row.amount
            }"`
          );
        } else if (amount <= 0) {
          errors.push(
            `Row ${index + 1}: amount must be greater than 0. Got: ${amount}`
          );
        } else if (amount > 999999999) {
          errors.push(
            `Row ${
              index + 1
            }: amount is too large. Maximum allowed: 999,999,999`
          );
        }
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
        } else {
          // Check if date is not too far in the past or future
          const now = dayjs();
          const yearsDiff = Math.abs(now.diff(startDate, "year"));
          if (yearsDiff > 50) {
            errors.push(
              `Row ${
                index + 1
              }: startDate seems unrealistic (${yearsDiff} years from now). Please check the date.`
            );
          }
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
        } else if (row.startDate) {
          const startDate = dayjs(row.startDate.trim(), "YYYY-MM-DD", true);
          if (startDate.isValid() && endDate.isBefore(startDate)) {
            errors.push(
              `Row ${index + 1}: endDate (${
                row.endDate
              }) cannot be before startDate (${row.startDate})`
            );
          }
        }
      }

      // Validate frequency if provided
      if (
        row.frequency &&
        !["daily", "weekly", "monthly", "yearly"].includes(
          row.frequency.toLowerCase()
        )
      ) {
        errors.push(
          `Row ${
            index + 1
          }: frequency must be one of: daily, weekly, monthly, yearly (case-insensitive). Got: "${
            row.frequency
          }"`
        );
      }

      // Validate paymentType
      if (
        row.paymentType &&
        !["income", "expense", "transfer"].includes(
          row.paymentType.toLowerCase()
        )
      ) {
        errors.push(
          `Row ${
            index + 1
          }: paymentType must be one of: income, expense, transfer (case-insensitive). Got: "${
            row.paymentType
          }"`
        );
      }

      // Validate confirmationType
      if (
        row.confirmationType &&
        !["manual", "automatic"].includes(row.confirmationType.toLowerCase())
      ) {
        errors.push(
          `Row ${
            index + 1
          }: confirmationType must be one of: manual, automatic (case-insensitive). Got: "${
            row.confirmationType
          }"`
        );
      }

      // Validate recurring field
      if (
        row.recurring &&
        !["true", "false"].includes(row.recurring.toLowerCase())
      ) {
        errors.push(
          `Row ${
            index + 1
          }: recurring must be true or false (case-insensitive). Got: "${
            row.recurring
          }"`
        );
      }

      // Validate interval (must be positive number)
      if (row.interval && row.interval.trim() !== "") {
        const interval = Number(row.interval);
        if (isNaN(interval) || interval <= 0) {
          errors.push(
            `Row ${
              index + 1
            }: interval must be a positive number (1, 2, 3, etc.). Got: "${
              row.interval
            }"`
          );
        } else if (interval > 100) {
          errors.push(
            `Row ${
              index + 1
            }: interval seems too large (${interval}). Maximum recommended: 100`
          );
        }
      }

      // Validate weeklyDays format (comma-separated numbers 0-6)
      if (row.weeklyDays && row.weeklyDays.trim() !== "") {
        const days = row.weeklyDays.split(",").map((d) => d.trim());
        const validDays = new Set();
        for (const day of days) {
          const dayNum = Number(day);
          if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
            errors.push(
              `Row ${
                index + 1
              }: weeklyDays must contain numbers 0-6 (0=Sunday, 6=Saturday). Invalid value: "${day}"`
            );
            break;
          }
          if (validDays.has(dayNum)) {
            errors.push(
              `Row ${index + 1}: weeklyDays contains duplicate day: ${dayNum}`
            );
            break;
          }
          validDays.add(dayNum);
        }
      }

      // Validate monthlyType
      if (
        row.monthlyType &&
        !["day", "week"].includes(row.monthlyType.toLowerCase())
      ) {
        errors.push(
          `Row ${
            index + 1
          }: monthlyType must be "day" or "week" (case-insensitive). Got: "${
            row.monthlyType
          }"`
        );
      }

      // Validate monthlyDay (1-31)
      if (row.monthlyDay && row.monthlyDay.trim() !== "") {
        const day = Number(row.monthlyDay);
        if (isNaN(day) || day < 1 || day > 31) {
          errors.push(
            `Row ${index + 1}: monthlyDay must be between 1 and 31. Got: "${
              row.monthlyDay
            }"`
          );
        }
      }

      // Validate monthlyWeek (-1, 1-4)
      if (row.monthlyWeek && row.monthlyWeek.trim() !== "") {
        const week = Number(row.monthlyWeek);
        if (isNaN(week) || ((week < 1 || week > 4) && week !== -1)) {
          errors.push(
            `Row ${
              index + 1
            }: monthlyWeek must be 1-4 (first to fourth) or -1 (last). Got: "${
              row.monthlyWeek
            }"`
          );
        }
      }

      // Validate monthlyWeekDay (0-6)
      if (row.monthlyWeekDay && row.monthlyWeekDay.trim() !== "") {
        const weekDay = Number(row.monthlyWeekDay);
        if (isNaN(weekDay) || weekDay < 0 || weekDay > 6) {
          errors.push(
            `Row ${
              index + 1
            }: monthlyWeekDay must be between 0 and 6 (0=Sunday, 6=Saturday). Got: "${
              row.monthlyWeekDay
            }"`
          );
        }
      }

      // Validate numberOfEvents
      if (row.numberOfEvents && row.numberOfEvents.trim() !== "") {
        const numEvents = Number(row.numberOfEvents);
        if (isNaN(numEvents) || numEvents <= 0) {
          errors.push(
            `Row ${
              index + 1
            }: numberOfEvents must be a positive number. Got: "${
              row.numberOfEvents
            }"`
          );
        } else if (numEvents > 1000) {
          errors.push(
            `Row ${
              index + 1
            }: numberOfEvents seems too large (${numEvents}). Maximum recommended: 1000`
          );
        }
      }

      // Validate transfer-specific requirements
      if (row.paymentType === "transfer" && !row.toAccount?.trim()) {
        errors.push(
          `Row ${index + 1}: toAccount is required for transfer payments`
        );
      }

      // Validate that toAccount is different from account for transfers
      if (
        row.paymentType === "transfer" &&
        row.toAccount?.trim() &&
        row.account?.trim()
      ) {
        if (
          row.account.trim().toLowerCase() ===
          row.toAccount.trim().toLowerCase()
        ) {
          errors.push(
            `Row ${
              index + 1
            }: toAccount cannot be the same as account for transfers`
          );
        }
      }

      // Validate endDateType and related fields
      if (row.endDateType) {
        if (
          !["forever", "numberofevents", "date"].includes(
            row.endDateType.toLowerCase()
          )
        ) {
          errors.push(
            `Row ${
              index + 1
            }: endDateType must be one of: forever, numberOfEvents, date (case-insensitive). Got: "${
              row.endDateType
            }"`
          );
        } else {
          switch (row.endDateType.toLowerCase()) {
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

      // Validate recurring payment consistency
      if (row.recurring?.toLowerCase() === "true") {
        if (!row.frequency) {
          errors.push(
            `Row ${index + 1}: frequency is required when recurring is true`
          );
        }

        // Validate monthly-specific combinations
        if (row.frequency?.toLowerCase() === "monthly") {
          if (row.monthlyType?.toLowerCase() === "day" && !row.monthlyDay) {
            errors.push(
              `Row ${
                index + 1
              }: monthlyDay is required when monthlyType is "day"`
            );
          }
          if (
            row.monthlyType?.toLowerCase() === "week" &&
            (!row.monthlyWeek || !row.monthlyWeekDay)
          ) {
            errors.push(
              `Row ${
                index + 1
              }: monthlyWeek and monthlyWeekDay are required when monthlyType is "week"`
            );
          }
        }

        // Validate weekly-specific combinations
        if (row.frequency?.toLowerCase() === "weekly" && !row.weeklyDays) {
          errors.push(
            `Row ${
              index + 1
            }: weeklyDays is recommended for weekly recurring payments`
          );
        }
      }

      // Validate field length limits
      if (row.name && row.name.length > 100) {
        errors.push(
          `Row ${index + 1}: name is too long (${
            row.name.length
          } characters). Maximum: 100`
        );
      }
      if (row.account && row.account.length > 50) {
        errors.push(
          `Row ${index + 1}: account name is too long (${
            row.account.length
          } characters). Maximum: 50`
        );
      }
      if (row.toAccount && row.toAccount.length > 50) {
        errors.push(
          `Row ${index + 1}: toAccount name is too long (${
            row.toAccount.length
          } characters). Maximum: 50`
        );
      }
      if (row.category && row.category.length > 50) {
        errors.push(
          `Row ${index + 1}: category is too long (${
            row.category.length
          } characters). Maximum: 50`
        );
      }
      if (row.notes && row.notes.length > 500) {
        errors.push(
          `Row ${index + 1}: notes is too long (${
            row.notes.length
          } characters). Maximum: 500`
        );
      }

      // Validate URL format for link field
      if (row.link && row.link.trim() !== "") {
        try {
          new URL(row.link);
        } catch {
          errors.push(
            `Row ${
              index + 1
            }: link must be a valid URL (e.g., https://example.com). Got: "${
              row.link
            }"`
          );
        }
      }

      // Validate account and toAccount format (no leading/trailing spaces)
      if (
        row.account &&
        (row.account.startsWith(" ") || row.account.endsWith(" "))
      ) {
        errors.push(
          `Row ${
            index + 1
          }: account name has leading or trailing spaces. Please trim whitespace.`
        );
      }
      if (
        row.toAccount &&
        (row.toAccount.startsWith(" ") || row.toAccount.endsWith(" "))
      ) {
        errors.push(
          `Row ${
            index + 1
          }: toAccount name has leading or trailing spaces. Please trim whitespace.`
        );
      }

      // Validate account names exist in the user's accounts
      const accountNames = accounts.map((acc) => acc.name);
      if (row.account && !accountNames.includes(row.account.trim())) {
        errors.push(
          `Row ${index + 1}: account "${
            row.account
          }" does not exist. Available accounts: ${accountNames.join(", ")}`
        );
      }

      if (
        row.toAccount &&
        row.toAccount.trim() &&
        !accountNames.includes(row.toAccount.trim())
      ) {
        errors.push(
          `Row ${index + 1}: toAccount "${
            row.toAccount
          }" does not exist. Available accounts: ${accountNames.join(", ")}`
        );
      }

      return errors;
    },
    [accounts]
  );

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
                }, got ${
                  values.length
                }. Please check for missing or extra commas. Expected headers: ${headers.join(
                  ", "
                )}`
              );
              return;
            }

            const rowData: Record<string, string> = {};
            headers.forEach((header, i) => {
              // Strip quotes that might be added by Excel/spreadsheet programs
              let value = values[i] || "";
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              rowData[header] = value;
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
              const start = startDateObj;
              const interval = parseInt(rowData.interval || "1");

              switch (rowData.frequency) {
                case "daily":
                  endDate = start
                    .add(numEvents * interval, "day")
                    .startOf("day")
                    .toISOString();
                  break;
                case "weekly":
                  endDate = start
                    .add(numEvents * interval, "week")
                    .startOf("day")
                    .toISOString();
                  break;
                case "monthly":
                  endDate = start
                    .add(numEvents * interval, "month")
                    .startOf("day")
                    .toISOString();
                  break;
                case "yearly":
                  endDate = start
                    .add(numEvents * interval, "year")
                    .startOf("day")
                    .toISOString();
                  break;
              }
            }

            // Parse payment type with fallback
            const paymentType = (rowData.paymentType ||
              "expense") as PaymentType;

            // Parse confirmation type with fallback
            const confirmationType = (rowData.confirmationType ||
              "manual") as PaymentConfirmationType;

            // Parse recurring flag
            const recurring =
              rowData.recurring?.toLowerCase() === "true" || false;

            // Build recurrence pattern for recurring payments
            let recurrence: RecurrencePattern | undefined;
            if (recurring && rowData.frequency) {
              recurrence = {
                frequency: rowData.frequency as FrequencyType,
                interval: parseInt(rowData.interval || "1"),
              };

              // Add weekly-specific fields
              if (rowData.frequency === "weekly" && rowData.weeklyDays) {
                recurrence.weeklyDays = rowData.weeklyDays
                  .split(",")
                  .map((d) => parseInt(d.trim()));
              }

              // Add monthly-specific fields
              if (rowData.frequency === "monthly") {
                if (rowData.monthlyType) {
                  recurrence.monthlyType = rowData.monthlyType as MonthlyType;
                }
                if (rowData.monthlyDay) {
                  recurrence.monthlyDay = parseInt(rowData.monthlyDay);
                }
                if (rowData.monthlyWeek) {
                  recurrence.monthlyWeek = parseInt(rowData.monthlyWeek);
                }
                if (rowData.monthlyWeekDay) {
                  recurrence.monthlyWeekDay = parseInt(rowData.monthlyWeekDay);
                }
              }
            }

            validPayments.push({
              id: uuidv4(),
              name: rowData.name,
              amount: Number(rowData.amount),
              account: rowData.account,
              toAccount: rowData.toAccount || undefined,
              category: rowData.category,
              tags,
              link: rowData.link || undefined,
              startDate,
              endDate,
              notes: rowData.notes || undefined,
              attachments: [],
              recurring,
              recurrence,
              paymentType,
              confirmationType,
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
    [validateRow]
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

  const formatFrequency = (recurrence: RecurrencePattern): string => {
    const { frequency, interval } = recurrence;

    if (interval === 1) {
      // Simple cases: "Daily", "Weekly", "Monthly", "Yearly"
      return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    } else {
      // Complex cases: "Every 2 weeks", "Every 3 months", etc.
      const frequencyMap = {
        daily: "day",
        weekly: "week",
        monthly: "month",
        yearly: "year",
      };

      const unit = frequencyMap[frequency as keyof typeof frequencyMap];
      return `Every ${interval} ${unit}${interval > 1 ? "s" : ""}`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-screen md:max-w-[600px] flex flex-col p-0 gap-0">
        <SheetHeader className="p-4">
          <SheetTitle>Import Payments</SheetTitle>
          <SheetDescription className="text-base">
            {previewData
              ? `Review ${previewData.length} payments before importing`
              : "Import multiple payments from a CSV file."}
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
                        Review these payments before importing. Verify all
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
                          <span className="text-muted-foreground">Type:</span>{" "}
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {payment.paymentType}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Confirmation:
                          </span>{" "}
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {payment.confirmationType}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Start:</span>{" "}
                          {dayjs(payment.startDate).format("MMM D, YYYY")}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Recurring:
                          </span>{" "}
                          <Badge
                            variant={payment.recurring ? "default" : "outline"}
                            className="text-xs"
                          >
                            {payment.recurring ? "Yes" : "No"}
                          </Badge>
                        </div>
                        {payment.toAccount && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">
                              To Account:
                            </span>{" "}
                            {payment.toAccount}
                          </div>
                        )}
                        {payment.recurrence && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">
                              Frequency:
                            </span>{" "}
                            {formatFrequency(payment.recurrence)}
                          </div>
                        )}
                        {payment.endDate && (
                          <div className="col-span-2">
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
                      These fields are required for each payment. Our template
                      includes them all.
                    </p>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            name
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Payment description (e.g., Netflix, Salary)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            amount
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Amount in Peso (e.g., 399.00, 75000)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            account
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Source account name (case-sensitive)
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            category
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Payment category (e.g., Bills, Income)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            startDate
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Start date in YYYY-MM-DD format
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
                      Payment Type & Confirmation
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Specify payment type and confirmation method.
                    </p>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            paymentType
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Choose from: income (money coming in), expense
                            (money going out), or transfer (moving money between
                            your accounts)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            confirmationType
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Choose manual (you confirm each payment) or
                            automatic (happens automatically)
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            recurring
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Set to "true" if this payment repeats, "false" for
                            one-time payments
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
                      Recurrence Pattern (For Recurring Payments)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Fine-tune how often recurring payments happen.
                    </p>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            frequency
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            How often: daily, weekly, monthly, yearly
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            interval
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Every X units (e.g., "2" for every 2 weeks). Default
                            is 1
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            weeklyDays
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            For weekly: which days? Use numbers 0-6 (0=Sunday,
                            6=Saturday), separated by commas like: 1,3,5
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            monthlyType
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            For monthly: "date" (same date each month) or "day"
                            (same weekday)
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            monthlyDay
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            If monthlyType is "date": which day of month (1-31)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            monthlyWeek
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            If monthlyType is "day": which week? 1-4 (first to
                            fourth) or -1 (last)
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            monthlyWeekDay
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            If monthlyType is "day": which day of week? 0-6
                            (0=Sunday, 6=Saturday)
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
                      Validation Rules
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Understanding our validation rules will help you prepare
                      error-free CSV files. Here are all the rules we check for.
                    </p>

                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-4"
                    >
                      <AccordionItem
                        value="required-validations"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            Required Field Validations
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <div className="rounded-lg border bg-red-50 p-3">
                                <h5 className="font-medium mb-2 text-red-800">
                                  Critical Requirements
                                </h5>
                                <p className="text-sm text-red-700">
                                  These fields are absolutely required for every
                                  payment row. Missing any of these will cause
                                  the import to fail.
                                </p>
                              </div>
                              <div className="grid grid-cols-1 gap-3 text-sm">
                                <div className="p-3 rounded border">
                                  <div className="font-medium mb-1">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                      name
                                    </code>
                                    Payment Name
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    • Must not be empty or just spaces
                                    <br />• Maximum 100 characters
                                    <br />• Example: "Netflix Subscription"
                                  </p>
                                </div>
                                <div className="p-3 rounded border">
                                  <div className="font-medium mb-1">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                      amount
                                    </code>
                                    Payment Amount
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    • Must be a valid positive number
                                    <br />• Must be greater than 0
                                    <br />• Maximum: 999,999,999
                                    <br />• Examples: 15.99, 1500.00, 75000.00
                                  </p>
                                </div>
                                <div className="p-3 rounded border">
                                  <div className="font-medium mb-1">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                      account
                                    </code>
                                    Account Name
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    • Must match an existing account name
                                    exactly
                                    <br />• Case-sensitive (Main Checking ≠ main
                                    checking)
                                    <br />• Use the exact name from your
                                    accounts list
                                    <br />• Example: &quot;Main Checking&quot;,
                                    &quot;High-Yield Savings&quot;
                                  </p>
                                </div>
                                <div className="p-3 rounded border bg-yellow-50">
                                  <div className="font-medium mb-1 text-yellow-800">
                                    <code className="text-xs bg-yellow-200 px-1.5 py-0.5 rounded mr-2">
                                      toAccount
                                    </code>
                                    Transfer Destination (Special Rule)
                                  </div>
                                  <p className="text-yellow-700 text-xs">
                                    • Required ONLY when paymentType is
                                    &quot;transfer&quot;
                                    <br />• Must be different from the source
                                    account
                                    <br />• Must match an existing account name
                                    exactly
                                    <br />• Case-sensitive (same rules as
                                    account field)
                                    <br />• Leave empty for income/expense
                                    payments
                                    <br />• Example: Main Checking → High-Yield
                                    Savings
                                  </p>
                                </div>
                                <div className="p-3 rounded border">
                                  <div className="font-medium mb-1">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                      category
                                    </code>
                                    Payment Category
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    • Must not be empty
                                    <br />• Maximum 50 characters
                                    <br />• Examples: "Subscriptions", "Bills",
                                    "Income"
                                  </p>
                                </div>
                                <div className="p-3 rounded border">
                                  <div className="font-medium mb-1">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                      startDate
                                    </code>
                                    Start Date
                                  </div>
                                  <p className="text-muted-foreground text-xs">
                                    • Must be in YYYY-MM-DD format
                                    <br />• Must be a valid calendar date
                                    <br />• Should be within 50 years of today
                                    <br />• Example: 2024-03-22
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="type-validations"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            Payment Type & Confirmation Validations
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    paymentType
                                  </code>
                                  Payment Type
                                </div>
                                <p className="text-muted-foreground text-xs mb-2">
                                  Must be one of these exact values
                                  (case-insensitive):
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="p-2 bg-green-50 rounded border">
                                    <code className="font-medium">income</code>
                                    <br />
                                    Money coming in
                                  </div>
                                  <div className="p-2 bg-red-50 rounded border">
                                    <code className="font-medium">expense</code>
                                    <br />
                                    Money going out
                                  </div>
                                  <div className="p-2 bg-blue-50 rounded border">
                                    <code className="font-medium">
                                      transfer
                                    </code>
                                    <br />
                                    Between accounts
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    confirmationType
                                  </code>
                                  Confirmation Type
                                </div>
                                <p className="text-muted-foreground text-xs mb-2">
                                  Must be one of these exact values
                                  (case-insensitive):
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="p-2 bg-orange-50 rounded border">
                                    <code className="font-medium">manual</code>
                                    <br />
                                    You confirm each payment
                                  </div>
                                  <div className="p-2 bg-green-50 rounded border">
                                    <code className="font-medium">
                                      automatic
                                    </code>
                                    <br />
                                    Happens automatically
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    recurring
                                  </code>
                                  Recurring Flag
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  • Must be exactly "true" or "false"
                                  (case-insensitive)
                                  <br />• If true, frequency field becomes
                                  required
                                  <br />• Examples: true, false, TRUE, False
                                </p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="recurrence-validations"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                            Recurrence Pattern Validations
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="rounded-lg border bg-purple-50 p-3">
                              <h5 className="font-medium mb-2 text-purple-800">
                                Recurring Payment Rules
                              </h5>
                              <p className="text-sm text-purple-700">
                                These validations apply only when the recurring
                                field is set to "true".
                              </p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    frequency
                                  </code>
                                  Frequency (Required for recurring)
                                </div>
                                <p className="text-muted-foreground text-xs mb-2">
                                  Must be one of these exact values
                                  (case-insensitive):
                                </p>
                                <div className="grid grid-cols-4 gap-1 text-xs">
                                  <div className="p-1 bg-muted rounded text-center">
                                    daily
                                  </div>
                                  <div className="p-1 bg-muted rounded text-center">
                                    weekly
                                  </div>
                                  <div className="p-1 bg-muted rounded text-center">
                                    monthly
                                  </div>
                                  <div className="p-1 bg-muted rounded text-center">
                                    yearly
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    interval
                                  </code>
                                  Interval
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  • Must be a positive number (1, 2, 3, etc.)
                                  <br />• Maximum recommended: 100
                                  <br />• Examples: 1 = every, 2 = every other,
                                  3 = every third
                                </p>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    weeklyDays
                                  </code>
                                  Weekly Days (for weekly frequency)
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  • Comma-separated numbers 0-6 (0=Sunday,
                                  6=Saturday)
                                  <br />• No duplicate days allowed
                                  <br />• Example: 1,3,5 (Monday, Wednesday,
                                  Friday)
                                </p>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  Monthly Recurrence Fields
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div>
                                    <code className="bg-muted px-1 py-0.5 rounded mr-1">
                                      monthlyType
                                    </code>
                                    "date" or "day" (case-insensitive)
                                  </div>
                                  <div className="ml-4 space-y-1 text-muted-foreground">
                                    <div>
                                      If "date":{" "}
                                      <code className="bg-muted px-1 py-0.5 rounded">
                                        monthlyDay
                                      </code>{" "}
                                      required (1-31)
                                    </div>
                                    <div>
                                      If "day":{" "}
                                      <code className="bg-muted px-1 py-0.5 rounded">
                                        monthlyWeek
                                      </code>{" "}
                                      (1-4 or -1) and{" "}
                                      <code className="bg-muted px-1 py-0.5 rounded">
                                        monthlyWeekDay
                                      </code>{" "}
                                      (0-6) required
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="end-date-validations"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                            End Date & Duration Validations
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    endDateType
                                  </code>
                                  End Date Type
                                </div>
                                <p className="text-muted-foreground text-xs mb-2">
                                  Must be one of these exact values
                                  (case-insensitive):
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="p-2 bg-green-50 rounded border">
                                    <code className="font-medium">forever</code>
                                    <br />
                                    Never ends
                                  </div>
                                  <div className="p-2 bg-blue-50 rounded border">
                                    <code className="font-medium">
                                      numberOfEvents
                                    </code>
                                    <br />
                                    Fixed count
                                  </div>
                                  <div className="p-2 bg-orange-50 rounded border">
                                    <code className="font-medium">date</code>
                                    <br />
                                    Specific end date
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    endDate
                                  </code>
                                  End Date (when endDateType is "date")
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  • Must be in YYYY-MM-DD format
                                  <br />• Must be a valid calendar date
                                  <br />• Must be after the start date
                                  <br />• Example: 2024-12-31
                                </p>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    numberOfEvents
                                  </code>
                                  Number of Events (when endDateType is
                                  "numberOfEvents")
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  • Must be a positive number
                                  <br />• Maximum recommended: 1000
                                  <br />• Examples: 12 (for 12 months), 52 (for
                                  52 weeks)
                                </p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="format-validations"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                            Format & Length Validations
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  Character Length Limits
                                </div>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <code className="bg-muted px-1 py-0.5 rounded mr-2">
                                      name
                                    </code>
                                    <span className="text-muted-foreground">
                                      Maximum 100 characters
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <code className="bg-muted px-1 py-0.5 rounded mr-2">
                                      account
                                    </code>
                                    <span className="text-muted-foreground">
                                      Maximum 50 characters
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <code className="bg-muted px-1 py-0.5 rounded mr-2">
                                      category
                                    </code>
                                    <span className="text-muted-foreground">
                                      Maximum 50 characters
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <code className="bg-muted px-1 py-0.5 rounded mr-2">
                                      notes
                                    </code>
                                    <span className="text-muted-foreground">
                                      Maximum 500 characters
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    link
                                  </code>
                                  URL Format
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  • Must be a valid URL if provided
                                  <br />• Should include protocol (http:// or
                                  https://)
                                  <br />• Examples: https://netflix.com,
                                  http://example.com
                                </p>
                              </div>
                              <div className="p-3 rounded border">
                                <div className="font-medium mb-1">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                    tags
                                  </code>
                                  Tags Format
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  • Multiple tags separated by semicolons (;)
                                  <br />• No validation on individual tag
                                  content
                                  <br />• Example:
                                  entertainment;streaming;monthly
                                </p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="common-errors"
                        className="border rounded-lg"
                      >
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            Common Errors & How to Fix Them
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="rounded-lg border bg-red-50 p-3">
                              <h5 className="font-medium mb-2 text-red-800">
                                Troubleshooting Guide
                              </h5>
                              <p className="text-sm text-red-700">
                                Here are the most common validation errors and
                                how to fix them.
                              </p>
                            </div>
                            <div className="space-y-3 text-sm">
                              <div className="p-3 rounded border border-red-200 bg-red-50">
                                <div className="font-medium text-red-800 mb-1">
                                  Error: "amount must be a valid number"
                                </div>
                                <div className="text-red-700 text-xs space-y-1">
                                  <div>
                                    <strong>Wrong:</strong> $15.99, 1,500.00,
                                    "15.99"
                                  </div>
                                  <div>
                                    <strong>Correct:</strong> 15.99, 1500.00,
                                    75000
                                  </div>
                                  <div>
                                    <strong>Fix:</strong> Remove currency
                                    symbols, commas, and quotes
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border border-red-200 bg-red-50">
                                <div className="font-medium text-red-800 mb-1">
                                  Error: "startDate must be a valid date in
                                  YYYY-MM-DD format"
                                </div>
                                <div className="text-red-700 text-xs space-y-1">
                                  <div>
                                    <strong>Wrong:</strong> 03/22/2024,
                                    22-03-2024, March 22, 2024
                                  </div>
                                  <div>
                                    <strong>Correct:</strong> 2024-03-22
                                  </div>
                                  <div>
                                    <strong>Fix:</strong> Use YYYY-MM-DD format
                                    with leading zeros
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border border-red-200 bg-red-50">
                                <div className="font-medium text-red-800 mb-1">
                                  Error: "toAccount is required for transfer
                                  payments"
                                </div>
                                <div className="text-red-700 text-xs space-y-1">
                                  <div>
                                    <strong>Problem:</strong> paymentType is
                                    "transfer" but toAccount is empty
                                  </div>
                                  <div>
                                    <strong>Fix:</strong> Add the destination
                                    account name to toAccount field
                                  </div>
                                  <div>
                                    <strong>Example:</strong> Checking → Savings
                                    Account
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border border-red-200 bg-red-50">
                                <div className="font-medium text-red-800 mb-1">
                                  Error: "frequency is required when recurring
                                  is true"
                                </div>
                                <div className="text-red-700 text-xs space-y-1">
                                  <div>
                                    <strong>Problem:</strong> recurring is
                                    "true" but frequency is empty
                                  </div>
                                  <div>
                                    <strong>Fix:</strong> Add one of: daily,
                                    weekly, monthly, yearly
                                  </div>
                                  <div>
                                    <strong>Tip:</strong> Most payments use
                                    "monthly"
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 rounded border border-red-200 bg-red-50">
                                <div className="font-medium text-red-800 mb-1">
                                  Error: "endDate cannot be before startDate"
                                </div>
                                <div className="text-red-700 text-xs space-y-1">
                                  <div>
                                    <strong>Problem:</strong> End date is
                                    earlier than start date
                                  </div>
                                  <div>
                                    <strong>Fix:</strong> Make sure endDate is
                                    after startDate
                                  </div>
                                  <div>
                                    <strong>Example:</strong> Start: 2024-03-01,
                                    End: 2024-12-31 ✓
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <div className="px-4 py-3">
                    <h4 className="text-sm font-semibold mb-3 flex items-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs mr-2">
                        5
                      </span>
                      Additional Information
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Optional fields to add more details to your payments.
                    </p>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
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
                            Add a website link related to this payment
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            endDateType
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Choose how the payment ends: &quot;forever&quot;,
                            &quot;numberOfEvents&quot;, or &quot;date&quot;
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            endDate / numberOfEvents
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Specific end date (YYYY-MM-DD) or number of payments
                          </p>
                        </div>
                        <div>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            notes
                          </code>
                          <p className="text-muted-foreground text-xs mt-1">
                            Add any extra details about this payment
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
                      Examples
                    </h4>

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
                                subscription at $399.00
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
                                      399.00
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      account
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Main Checking
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
                                      paymentType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      expense
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      confirmationType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      automatic
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      recurring
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      true
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
                                      interval
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      1
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
                                Monthly Salary Income
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                Use this format for regular income payments like
                                salary or payments that repeat a specific number
                                of times.
                              </p>
                              <div className="mt-2 text-sm">
                                <strong>Example:</strong> Monthly salary for 12
                                months at ₱75,000.00
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
                                      Salary
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      amount
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      75000.00
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      account
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Main Checking
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      category
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Income
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      startDate
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      2024-03-01
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      paymentType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      income
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      confirmationType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      automatic
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      recurring
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      true
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
                                      interval
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      1
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      monthlyDay
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      1
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      tags
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      salary;work
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
                            Money Transfer
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3">
                              <h5 className="font-medium mb-2">
                                Monthly Savings Transfer
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                Use this format for transferring money between
                                your accounts. Perfect for automated savings,
                                moving money to investment accounts, or any
                                recurring transfer between accounts.
                              </p>
                              <div className="mt-2 text-sm">
                                <strong>Example:</strong> Monthly ₱5,000
                                transfer from Main Checking to Savings Account
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
                                      Savings Transfer
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      amount
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      5000.00
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      account
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Main Checking
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      category
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Transfers
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
                                      paymentType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      transfer
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      confirmationType
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      manual
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      toAccount
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      Savings Account
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      recurring
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      true
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
                                      interval
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      1
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      tags
                                    </td>
                                    <td className="px-3 py-2 font-mono text-xs">
                                      savings;monthly
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
