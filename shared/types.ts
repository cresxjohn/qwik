export type PaymentType = "income" | "expense" | "transfer";
export type EndDateType = "forever" | "number" | "date";

export interface Attachment {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
}

export interface Payment {
  id: string;
  name: string;
  amount: number;
  account: string;
  toAccount?: string;
  paymentType: PaymentType;
  category: string;
  tags: string[];
  recurring: boolean;
  frequency?: string;
  link?: string;
  startDate: string;
  lastPaymentDate: string;
  nextDueDate: string;
  paymentDate: string;
  endDate?: string;
  notes?: string;
  attachments?: Attachment[];
}
