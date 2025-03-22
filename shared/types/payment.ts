export type Frequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type PaymentType = "income" | "expense" | "transfer";

export type ReminderType = "onDay" | "before";

export interface Reminder {
  type: ReminderType;
  days: number; // 0 for onDay, positive number for before
}

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
  frequency?: Frequency;
  startDate: string;
  endDate?: string;
  paymentDate: string;
  lastPaymentDate: string;
  nextDueDate: string;
  category: string;
  tags: string[];
  reminders: Reminder[]; // New field for reminders
}

export type EndDateType = "forever" | "number" | "date";

export type Attachment = {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
};
