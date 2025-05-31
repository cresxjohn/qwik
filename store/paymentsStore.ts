import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Payment } from "@/shared/types";

interface PaymentsState {
  items: Payment[];
  loading: boolean;
  error: string | null;
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;
  setPayments: (payments: Payment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePaymentsStore = create<PaymentsState>()(
  persist(
    immer((set) => ({
      items: [],
      loading: false,
      error: null,
      addPayment: (payment) =>
        set((state) => {
          state.items.push(payment);
        }),
      updatePayment: (payment) =>
        set((state) => {
          const index = state.items.findIndex((p) => p.id === payment.id);
          if (index !== -1) {
            state.items[index] = payment;
          }
        }),
      deletePayment: (id) =>
        set((state) => {
          state.items = state.items.filter((p) => p.id !== id);
        }),
      setPayments: (payments) =>
        set((state) => {
          state.items = payments;
        }),
      setLoading: (loading) =>
        set((state) => {
          state.loading = loading;
        }),
      setError: (error) =>
        set((state) => {
          state.error = error;
        }),
    })),
    {
      name: "payments-storage",
    }
  )
);
