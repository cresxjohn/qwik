"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Attachment,
  EndDateType,
  Payment,
  PaymentType,
  PaymentConfirmationType,
  RecurrencePattern,
  FrequencyType,
  MonthlyType,
  Frequency,
} from "@/shared/types";
import {
  calculateNextDueDateFromRecurrence,
  formatRecurrencePattern,
  legacyToRecurrencePattern,
} from "@/shared/utils";
import { usePaymentsStore } from "@/store/payments";
import dayjs from "dayjs";
import {
  CalendarIcon,
  ImageIcon,
  Loader2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { AccountSelect } from "./account-select";
import { CategorySelect } from "./category-select";
import { cn } from "@/lib/utils";

const frequencyTypes = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const weekNames = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: -1, label: "Last" },
];

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Payment;
}

interface FormData {
  name: string;
  amount: string;
  account: string;
  toAccount: string;
  category: string;
  tags: string[];
  link: string;
  startDate: Date | undefined;
  numberOfEvents: string;
  endDate: Date | undefined;
  notes: string;
  attachments: Attachment[];
  recurrence: RecurrencePattern;
  confirmationType: PaymentConfirmationType;
}

export function PaymentForm({ onCancel, initialData }: PaymentFormProps) {
  const { addPayment, updatePayment } = usePaymentsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(
    initialData?.recurring || false
  );
  const [paymentType, setPaymentType] = useState<PaymentType>(
    initialData?.paymentType || "expense"
  );
  const [endDateType, setEndDateType] = useState<EndDateType>(() => {
    if (!initialData?.endDate) return "forever";
    if (initialData.endDate === "forever") return "forever";
    return "date";
  });

  const [formData, setFormData] = useState<FormData>(() => {
    // Convert legacy frequency to new recurrence pattern if needed
    let recurrence: RecurrencePattern = {
      frequency: "monthly",
      interval: 1,
      monthlyType: "day",
    };

    if (initialData?.recurrence) {
      recurrence = initialData.recurrence;
    } else if (
      initialData &&
      "frequency" in initialData &&
      initialData.frequency
    ) {
      // Handle legacy frequency conversion
      recurrence = legacyToRecurrencePattern(
        initialData.frequency as Frequency
      );
    }

    // Convert string[] attachments to Attachment[]
    const attachments =
      initialData?.attachments?.map((url) => ({
        url,
        key: url,
        thumbnailUrl: url,
        thumbnailKey: url,
      })) || [];

    return {
      name: initialData?.name ?? "",
      amount: initialData?.amount.toString() ?? "",
      account: initialData?.account ?? "",
      toAccount: initialData?.toAccount ?? "",
      category: initialData?.category ?? "",
      tags: initialData?.tags ?? [],
      link: initialData?.link ?? "",
      startDate: initialData?.startDate
        ? new Date(initialData.startDate)
        : new Date(),
      numberOfEvents: "",
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      notes: initialData?.notes ?? "",
      attachments,
      recurrence,
      confirmationType: initialData?.confirmationType || "manual",
    };
  });

  // Clean up attachments when component unmounts
  useEffect(() => {
    return () => {
      formData.attachments.forEach((attachment) => {
        if (attachment.url.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.url);
        }
      });
    };
  }, [formData.attachments]);

  const calculateEndDate = () => {
    if (!formData.startDate || !isRecurring) return undefined;

    const startDate = dayjs(formData.startDate);
    let endDate: Date | undefined;

    switch (endDateType) {
      case "number": {
        if (!formData.numberOfEvents) return undefined;
        const numEvents = parseInt(formData.numberOfEvents);

        // Calculate end date based on recurrence pattern
        let current = startDate;
        for (let i = 0; i < numEvents - 1; i++) {
          current = dayjs(
            calculateNextDueDateFromRecurrence(
              current.toISOString(),
              formData.recurrence,
              current.toISOString()
            )
          );
        }
        endDate = current.toDate();
        break;
      }
      case "date":
        endDate = formData.endDate;
        break;
    }

    return endDate;
  };

  const updateRecurrence = (updates: Partial<RecurrencePattern>) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: { ...prev.recurrence, ...updates },
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setLoading(true);
      const uploadResults = await Promise.all(
        files.map(async (file) => {
          try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.details || data.error || "Failed to upload file"
              );
            }

            return {
              url: data.url,
              key: data.key,
              thumbnailUrl: data.thumbnailUrl,
              thumbnailKey: data.thumbnailKey,
            };
          } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
          }
        })
      );

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadResults],
      }));
    } catch (error) {
      console.error("Error processing attachments:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload attachments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.amount || !formData.account) {
        throw new Error("Please fill in all required fields");
      }

      if (paymentType === "transfer" && !formData.toAccount) {
        throw new Error("Please specify the destination account for transfer");
      }

      if (isRecurring) {
        if (endDateType === "number" && !formData.numberOfEvents) {
          throw new Error("Please specify the number of events");
        }

        if (endDateType === "date" && !formData.endDate) {
          throw new Error("Please select an end date");
        }
      }

      const amount = parseFloat(formData.amount);
      const paymentData: Payment = {
        id: initialData?.id ?? uuidv4(),
        name: formData.name,
        amount:
          paymentType === "expense" ? -Math.abs(amount) : Math.abs(amount),
        account: formData.account,
        toAccount: paymentType === "transfer" ? formData.toAccount : undefined,
        paymentType,
        category: formData.category,
        tags: formData.tags,
        recurring: isRecurring,
        recurrence: isRecurring ? formData.recurrence : undefined,
        link: formData.link ?? undefined,
        startDate: formData.startDate
          ? dayjs(formData.startDate).toISOString()
          : dayjs().toISOString(),
        lastPaymentDate:
          initialData?.lastPaymentDate ??
          (formData.startDate
            ? dayjs(formData.startDate).toISOString()
            : dayjs().toISOString()),
        nextDueDate:
          initialData?.nextDueDate ??
          (formData.startDate
            ? dayjs(formData.startDate).toISOString()
            : dayjs().toISOString()),
        paymentDate:
          initialData?.paymentDate ??
          (formData.startDate
            ? dayjs(formData.startDate).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD")),
        endDate: isRecurring
          ? (() => {
              const endDate = calculateEndDate();
              return endDate ? dayjs(endDate).toISOString() : undefined;
            })()
          : undefined,
        notes: formData.notes || undefined,
        attachments:
          formData.attachments.length > 0
            ? formData.attachments.map((attachment) => attachment.url)
            : undefined,
        confirmationType: formData.confirmationType,
      };

      if (initialData) {
        updatePayment(paymentData);
      } else {
        addPayment(paymentData);
      }

      onCancel();
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      e.currentTarget.value = "";
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const renderRecurrenceOptions = () => {
    const { recurrence } = formData;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={recurrence.frequency}
              onValueChange={(value: FrequencyType) =>
                updateRecurrence({ frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyTypes.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often this payment repeats
            </p>
          </div>

          <div className="space-y-2">
            <Label>Every</Label>
            <Input
              type="number"
              min="1"
              value={recurrence.interval}
              onChange={(e) =>
                updateRecurrence({ interval: parseInt(e.target.value) || 1 })
              }
              placeholder="1"
            />
            <p className="text-sm text-muted-foreground">
              Repeat every X intervals
            </p>
          </div>
        </div>

        {recurrence.frequency === "weekly" && (
          <div className="space-y-2">
            <Label>Repeat on</Label>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day, index) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${index}`}
                    checked={recurrence.weeklyDays?.includes(index) || false}
                    onCheckedChange={(checked) => {
                      const currentDays = recurrence.weeklyDays || [];
                      if (checked) {
                        updateRecurrence({
                          weeklyDays: [...currentDays, index].sort(),
                        });
                      } else {
                        updateRecurrence({
                          weeklyDays: currentDays.filter((d) => d !== index),
                        });
                      }
                    }}
                  />
                  <Label htmlFor={`day-${index}`} className="text-sm">
                    {day.slice(0, 3)}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Select specific days of the week
            </p>
          </div>
        )}

        {recurrence.frequency === "monthly" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monthly repeat type</Label>
              <Select
                value={recurrence.monthlyType || "day"}
                onValueChange={(value: MonthlyType) =>
                  updateRecurrence({ monthlyType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">By day of month</SelectItem>
                  <SelectItem value="week">By day of week</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how monthly recurrence works
              </p>
            </div>

            {recurrence.monthlyType === "day" && (
              <div className="space-y-2">
                <Label>Day of month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={
                    recurrence.monthlyDay ||
                    (formData.startDate ? formData.startDate.getDate() : 1)
                  }
                  onChange={(e) =>
                    updateRecurrence({
                      monthlyDay: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Day of the month (1-31)
                </p>
              </div>
            )}

            {recurrence.monthlyType === "week" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Week</Label>
                  <Select
                    value={recurrence.monthlyWeek?.toString() || "1"}
                    onValueChange={(value) =>
                      updateRecurrence({ monthlyWeek: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {weekNames.map((week) => (
                        <SelectItem
                          key={week.value}
                          value={week.value.toString()}
                        >
                          {week.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Which week of the month
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select
                    value={recurrence.monthlyWeekDay?.toString() || "1"}
                    onValueChange={(value) =>
                      updateRecurrence({ monthlyWeekDay: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Day of the week
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Summary:</strong> {formatRecurrencePattern(recurrence)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-6">
          {!initialData && (
            <div className="space-y-2">
              <Tabs
                defaultValue={paymentType}
                className="w-full"
                onValueChange={(value) => setPaymentType(value as PaymentType)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="transfer">Transfer</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-sm text-muted-foreground">
                Select the type of transaction
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Netflix Subscription, Gym Membership"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              A descriptive name to identify this payment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              Payment amount in your local currency
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">
              {paymentType === "transfer" ? "From Account" : "Account"}
            </Label>
            <AccountSelect
              placeholder={
                paymentType === "transfer"
                  ? "Source account"
                  : "e.g., Credit Card, Bank Account"
              }
              value={formData.account}
              onValueChange={(value: string) =>
                setFormData({ ...formData, account: value })
              }
            />
            <p className="text-sm text-muted-foreground">
              {paymentType === "transfer"
                ? "Account to transfer from"
                : "Account or payment method to use"}
            </p>
          </div>

          {paymentType === "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="toAccount">To Account</Label>
              <AccountSelect
                placeholder="Destination account"
                value={formData.toAccount}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, toAccount: value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Account to transfer to
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelect
              value={formData.category}
              onValueChange={(value: string) =>
                setFormData({ ...formData, category: value })
              }
              paymentType={paymentType}
              placeholder="Select or type category..."
            />
            <p className="text-sm text-muted-foreground">
              Group similar payments for easier budgeting
            </p>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? (
                    dayjs(formData.startDate).format("MMM D, YYYY")
                  ) : (
                    <span>Select a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, startDate: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              When this payment begins
            </p>
          </div>

          <div className="space-y-3">
            <Label>Payment Confirmation</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              <button
                type="button"
                className={cn(
                  "relative text-left rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-full",
                  formData.confirmationType === "manual"
                    ? "border-primary bg-primary/5"
                    : "border-input"
                )}
                onClick={() =>
                  setFormData({ ...formData, confirmationType: "manual" })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFormData({ ...formData, confirmationType: "manual" });
                  }
                }}
                aria-pressed={formData.confirmationType === "manual"}
                aria-describedby="manual-confirmation-desc"
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex-1">
                    <h3 className="font-medium">Manual Confirmation</h3>
                    <p
                      id="manual-confirmation-desc"
                      className="text-sm text-muted-foreground mt-1"
                    >
                      You&apos;ll manually mark payments as completed when
                      processed
                    </p>
                  </div>
                  {formData.confirmationType === "manual" && (
                    <div
                      className="text-primary flex-shrink-0"
                      aria-hidden="true"
                    >
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </button>

              <button
                type="button"
                className={cn(
                  "relative text-left rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-full",
                  formData.confirmationType === "automatic"
                    ? "border-primary bg-primary/5"
                    : "border-input"
                )}
                onClick={() =>
                  setFormData({ ...formData, confirmationType: "automatic" })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFormData({ ...formData, confirmationType: "automatic" });
                  }
                }}
                aria-pressed={formData.confirmationType === "automatic"}
                aria-describedby="automatic-confirmation-desc"
              >
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex-1">
                    <h3 className="font-medium">Automatic Confirmation</h3>
                    <p
                      id="automatic-confirmation-desc"
                      className="text-sm text-muted-foreground mt-1"
                    >
                      System automatically marks payments as completed
                    </p>
                  </div>
                  {formData.confirmationType === "automatic" && (
                    <div
                      className="text-primary flex-shrink-0"
                      aria-hidden="true"
                    >
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose how payment completion is tracked
            </p>
          </div>

          <div className="space-y-4">
            <Label>Payment Type</Label>
            <Tabs
              defaultValue={initialData?.recurring ? "recurring" : "one-time"}
              className="w-full"
              onValueChange={(value) => {
                setIsRecurring(value === "recurring");
                if (value === "one-time") {
                  setFormData((prev) => ({
                    ...prev,
                    numberOfEvents: "",
                    endDate: undefined,
                  }));
                  setEndDateType("forever");
                }
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="one-time">One-time Payment</TabsTrigger>
                <TabsTrigger value="recurring">Recurring Payment</TabsTrigger>
              </TabsList>
              <TabsContent value="recurring" className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-4 mt-4">
                    <Label>Recurrence Pattern</Label>
                    <p className="text-sm text-muted-foreground">
                      Configure how often this payment repeats
                    </p>
                    {renderRecurrenceOptions()}
                  </div>

                  <div className="space-y-4">
                    <Label>End Date Options</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose when this recurring payment should stop
                    </p>
                    <Tabs
                      defaultValue={endDateType}
                      className="w-full"
                      onValueChange={(value) =>
                        setEndDateType(value as EndDateType)
                      }
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="forever">Forever</TabsTrigger>
                        <TabsTrigger value="number">No. of Events</TabsTrigger>
                        <TabsTrigger value="date">Specific Date</TabsTrigger>
                      </TabsList>
                      <TabsContent value="number" className="space-y-2">
                        <Label htmlFor="numberOfEvents">Number of Events</Label>
                        <Input
                          id="numberOfEvents"
                          type="number"
                          placeholder="e.g., 12 for monthly payments for a year"
                          value={formData.numberOfEvents}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              numberOfEvents: e.target.value,
                            })
                          }
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          How many times this payment will occur
                        </p>
                      </TabsContent>
                      <TabsContent value="date" className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.endDate ? (
                                dayjs(formData.endDate).format("MMM D, YYYY")
                              ) : (
                                <span>Select end date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.endDate}
                              onSelect={(date) =>
                                setFormData({ ...formData, endDate: date })
                              }
                              initialFocus
                              required
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-sm text-muted-foreground">
                          When this recurring payment ends
                        </p>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">URL (Optional)</Label>
            <Input
              id="link"
              placeholder="https://"
              type="url"
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Link to payment website or account portal
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this payment..."
              value={formData.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Additional details or reminders
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <div className="space-y-2">
              <Input
                id="tags"
                placeholder="Type and press Enter to add tags"
                onKeyDown={handleTagInput}
              />
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Add tags to organize and filter payments
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Attachments (Optional)</Label>
              {formData.attachments.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/5"
                  onClick={() => {
                    // Revoke all image URLs
                    formData.attachments.forEach((attachment) => {
                      if (attachment.url.startsWith("blob:")) {
                        URL.revokeObjectURL(attachment.url);
                      }
                    });
                    setFormData((prev) => ({
                      ...prev,
                      attachments: [],
                    }));
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {formData.attachments.map((attachment, index) => (
                <div key={`attachment-${index}`} className="relative group">
                  <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                    {attachment.url.startsWith("data:image/") ||
                    attachment.url.startsWith("https://") ? (
                      <Image
                        src={attachment.thumbnailUrl || attachment.url}
                        alt={`Attachment ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized={attachment.url.startsWith("data:image/")}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-2">
                          {`Attachment ${index + 1}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-background border shadow-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                {loading ? (
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload receipts, bills, or related documents
            </p>
          </div>
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
