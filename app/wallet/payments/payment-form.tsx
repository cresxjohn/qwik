/* eslint-disable @next/next/no-img-element */
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
import { Attachment, EndDateType, Payment, PaymentType } from "@/shared/types";
import { getFrequencyUnit } from "@/shared/utils";
import { usePaymentsStore } from "@/store/payments";
import dayjs from "dayjs";
import { CalendarIcon, ImageIcon, Loader2, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Payment;
}

interface FormData {
  name: string;
  amount: string;
  frequency: string;
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
}

export function PaymentForm({
  onSuccess,
  onCancel,
  initialData,
}: PaymentFormProps) {
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
    // If it's a specific date, check if it's calculated from number of events
    const startDate = dayjs(initialData.startDate);
    const endDate = dayjs(initialData.endDate);
    const frequency = initialData.frequency;

    if (frequency) {
      const diff = endDate.diff(startDate, getFrequencyUnit(frequency));

      // If the difference is a whole number of frequency units, it's likely a number of events
      if (Number.isInteger(diff)) {
        return "number";
      }
    }
    return "date";
  });

  const [formData, setFormData] = useState<FormData>(() => {
    let numberOfEvents = "";
    if (initialData?.endDate && initialData.frequency) {
      const startDate = dayjs(initialData.startDate);
      const endDate = dayjs(initialData.endDate);
      const diff = endDate.diff(
        startDate,
        getFrequencyUnit(initialData.frequency)
      );
      if (Number.isInteger(diff)) {
        numberOfEvents = diff.toString();
      }
    }

    // Convert string[] attachments to Attachment[]
    const attachments =
      initialData?.attachments?.map((url) => ({
        url,
        key: url, // Using URL as key since we don't have the original key
        thumbnailUrl: url, // Using same URL for thumbnail since we don't have the original
        thumbnailKey: url, // Using same URL as key for thumbnail
      })) || [];

    return {
      name: initialData?.name ?? "",
      amount: initialData?.amount.toString() ?? "",
      frequency: initialData?.frequency ?? "",
      account: initialData?.account ?? "",
      toAccount: initialData?.toAccount ?? "",
      category: initialData?.category ?? "",
      tags: initialData?.tags ?? [],
      link: initialData?.link ?? "",
      startDate: initialData?.startDate
        ? new Date(initialData.startDate)
        : new Date(),
      numberOfEvents,
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      notes: initialData?.notes ?? "",
      attachments,
    };
  });

  // Clean up attachments when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any object URLs when component unmounts
      formData.attachments.forEach((attachment) => {
        if (attachment.url.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.url);
        }
      });
    };
  }, [formData.attachments]);

  const calculateEndDate = () => {
    if (!formData.startDate || !formData.frequency) return undefined;

    const startDate = dayjs(formData.startDate);
    let endDate: Date | undefined;

    switch (endDateType) {
      case "number": {
        if (!formData.numberOfEvents) return undefined;
        const numEvents = parseInt(formData.numberOfEvents);
        switch (formData.frequency) {
          case "weekly":
            endDate = startDate.add(numEvents, "week").toDate();
            break;
          case "fortnightly":
            endDate = startDate.add(numEvents * 2, "week").toDate();
            break;
          case "monthly":
            endDate = startDate.add(numEvents, "month").toDate();
            break;
          case "quarterly":
            endDate = startDate.add(numEvents * 3, "month").toDate();
            break;
          case "yearly":
            endDate = startDate.add(numEvents, "year").toDate();
            break;
        }
        break;
      }
      case "date":
        endDate = formData.endDate;
        break;
    }

    return endDate;
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
        if (!formData.frequency) {
          throw new Error("Please select a frequency for recurring payments");
        }

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
        frequency: formData.frequency as Payment["frequency"],
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
      };

      if (initialData) {
        updatePayment(paymentData);
      } else {
        addPayment(paymentData);
      }
      onSuccess();
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
              Give your payment a descriptive name to easily identify it
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
              Enter the payment amount in your local currency
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">
              {paymentType === "transfer" ? "From Account" : "Account"}
            </Label>
            <Input
              id="account"
              placeholder={
                paymentType === "transfer"
                  ? "Source account"
                  : "e.g., Credit Card, Bank Account"
              }
              value={formData.account}
              onChange={(e) =>
                setFormData({ ...formData, account: e.target.value })
              }
              required
            />
            <p className="text-sm text-muted-foreground">
              {paymentType === "transfer"
                ? "Specify the source account for the transfer"
                : "Specify which account or payment method will be used"}
            </p>
          </div>

          {paymentType === "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="toAccount">To Account</Label>
              <Input
                id="toAccount"
                placeholder="Destination account"
                value={formData.toAccount}
                onChange={(e) =>
                  setFormData({ ...formData, toAccount: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Specify the destination account for the transfer
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="Enter category"
              required
            />
            <p className="text-sm text-muted-foreground">
              Categorize your payment (e.g., Entertainment, Utilities,
              Insurance) to help with budgeting and organization
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
              When does this payment start? For recurring payments, this will be
              your first payment date
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
                  setFormData({
                    ...formData,
                    frequency: "",
                    numberOfEvents: "",
                    endDate: undefined,
                  });
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
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, frequency: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      How often will this payment occur?
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>End Date Options</Label>
                    <Tabs
                      defaultValue={endDateType}
                      className="w-full"
                      onValueChange={(value) =>
                        setEndDateType(value as EndDateType)
                      }
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="forever">Forever</TabsTrigger>
                        <TabsTrigger value="number">
                          Number of Events
                        </TabsTrigger>
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
                          How many times should this payment occur? The end date
                          will be calculated automatically
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
                          When should this recurring payment end?
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
              Add a link to the payment website or portal for quick access
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
              Add any relevant information or reminders about this payment
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
              Add custom tags to group related payments or add specific labels
              (e.g., #urgent, #shared, #work)
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
          </div>
        </div>
      </div>{" "}
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
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
