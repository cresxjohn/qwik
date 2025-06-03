export type FrequencyType = "daily" | "weekly" | "monthly" | "yearly";

export type MonthlyType = "date" | "day"; // by date of month vs by day of week

export interface RecurrencePattern {
  frequency: FrequencyType;
  interval: number; // every X units (e.g., every 2 weeks)
  weeklyDays?: number[]; // for weekly: days of week (0=Sunday, 6=Saturday)
  monthlyType?: MonthlyType; // for monthly: by date or by day of week
  monthlyDay?: number; // day of month (1-31)
  monthlyWeek?: number; // 1-4 for first/second/third/fourth, -1 for last
  monthlyWeekDay?: number; // 0-6, day of week for monthly by day
}

export type PaymentType = "income" | "expense" | "transfer";

export type PaymentConfirmationType = "manual" | "automatic";

export interface Payment {
  id: string;
  name: string;
  amount: number;
  account: string;
  toAccount?: string; // For transfer payments
  paymentType: PaymentType;
  link?: string;
  notes?: string;
  attachments?: string[];
  recurring: boolean;
  confirmationType: PaymentConfirmationType;
  recurrence?: RecurrencePattern;
  startDate: string;
  endDate?: string;
  paymentDate: string;
  lastPaymentDate: string;
  nextDueDate: string;
  category: string;
  tags: string[];
}

export type EndDateType = "forever" | "number" | "date";

export interface Attachment {
  url: string;
  key: string;
  thumbnailUrl: string;
  thumbnailKey: string;
}

// Legacy type for backward compatibility
export type Frequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "yearly";
