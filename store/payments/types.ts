import { Payment } from "@/shared/types";

export interface PaymentsState {
  items: Payment[];
  loading: boolean;
  error: string | null;
}

export interface PaymentsActions {
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;
  setPayments: (payments: Payment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface PaymentsStore extends PaymentsState, PaymentsActions {}
