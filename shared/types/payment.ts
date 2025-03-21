export type Frequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type PaymentType = "income" | "expense" | "transfer";

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
}

export type EndDateType = "forever" | "number" | "date";
