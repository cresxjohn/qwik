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
import { addPayment, updatePayment } from "@/store/slices/paymentsSlice";
import dayjs from "dayjs";
import { CalendarIcon, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Payment } from "./payments-table";

const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const getFrequencyUnit = (
  frequency: string | undefined
): "week" | "month" | "year" => {
  if (frequency === "weekly" || frequency === "fortnightly") return "week";
  if (frequency === "monthly" || frequency === "quarterly") return "month";
  return "year";
};

type EndDateType = "forever" | "number" | "date";

interface PaymentFormProps {
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
  readonly initialData?: Payment;
}

interface FormData {
  name: string;
  amount: string;
  frequency: string;
  account: string;
  link: string;
  startDate: Date | undefined;
  numberOfEvents: string;
  endDate: Date | undefined;
  notes: string;
  attachments: File[];
}

export function PaymentForm({
  onSuccess,
  onCancel,
  initialData,
}: PaymentFormProps) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(
    initialData?.recurring || false
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

    // Convert base64 attachments to File objects
    const attachments: File[] = [];
    if (initialData?.attachments) {
      initialData.attachments.forEach((base64String, index) => {
        // Extract the base64 data and mime type
        const matches = base64String.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/
        );
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          // Convert base64 to blob
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: mimeType });
          attachments.push(
            new File(
              [blob],
              `attachment-${index + 1}.${mimeType.split("/")[1]}`,
              { type: mimeType }
            )
          );
        }
      });
    }

    return {
      name: initialData?.name ?? "",
      amount: initialData?.amount.toString() ?? "",
      frequency: initialData?.frequency ?? "",
      account: initialData?.account ?? "",
      link: initialData?.link ?? "",
      startDate: initialData?.startDate
        ? new Date(initialData.startDate)
        : undefined,
      numberOfEvents,
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      notes: initialData?.notes ?? "",
      attachments,
    };
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.amount || !formData.startDate) {
        throw new Error("Please fill in all required fields");
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

      // Convert attachments to base64
      const attachmentPromises = formData.attachments.map(async (file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const attachments = await Promise.all(attachmentPromises);

      const paymentData: Payment = {
        id: initialData?.id ?? uuidv4(),
        name: formData.name,
        amount: parseFloat(formData.amount),
        account: formData.account,
        category: initialData?.category ?? "Subscription",
        tags: initialData?.tags ?? [],
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
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      if (initialData) {
        dispatch(updatePayment(paymentData));
      } else {
        dispatch(addPayment(paymentData));
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles],
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col h-full">
      <div className="flex-1 space-y-6 px-4 overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Payment Name</Label>
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
            <Label htmlFor="account">Account</Label>
            <Input
              id="account"
              placeholder="e.g., Credit Card, Bank Account"
              value={formData.account}
              onChange={(e) =>
                setFormData({ ...formData, account: e.target.value })
              }
            />
            <p className="text-sm text-muted-foreground">
              Specify which account or payment method will be used
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, frequency: value })
                      }
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
            <Label>Attachments (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              {formData.attachments.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative group">
                  <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (file.type.startsWith("image/")) {
                        URL.revokeObjectURL(URL.createObjectURL(file));
                      }
                      removeAttachment(index);
                    }}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-background border shadow-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/5 transition-all opacity-0 group-hover:opacity-100"
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
                />
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Add photos of receipts, invoices, or other relevant documents
            </p>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 mt-4">
        {error && (
          <div className="text-sm text-red-500 text-center mb-4">{error}</div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Payment" : "Create Payment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
