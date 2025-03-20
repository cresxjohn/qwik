export type Frequency = "weekly" | "monthly" | "yearly";

export interface Payment {
  id: string;
  name: string;
  amount: number;
  account: string;
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

export interface PaymentType {
  name: string;
  value: number;
}
