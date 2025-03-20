export interface Transaction {
  id: string;
  name: string;
  amount: number;
  account: string;
  paymentDate: string;
  category: string;
  tags: string[];
  type: "income" | "expense";
  notes?: string;
  attachments?: string[];
}
