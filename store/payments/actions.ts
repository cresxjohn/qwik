import { StateCreator } from "zustand";
import { Payment } from "@/shared/types";
import { PaymentsStore } from "./types";

export const createPaymentsActions: StateCreator<
  PaymentsStore,
  [["zustand/immer", never]],
  [],
  PaymentsStore
> = (set) => ({
  items: [],
  loading: false,
  error: null,

  addPayment: (payment: Payment) =>
    set((state) => {
      state.items.push(payment);
    }),

  updatePayment: (payment: Payment) =>
    set((state) => {
      const index = state.items.findIndex((p) => p.id === payment.id);
      if (index !== -1) {
        state.items[index] = payment;
      }
    }),

  deletePayment: (id: string) =>
    set((state) => {
      state.items = state.items.filter((p) => p.id !== id);
    }),

  setPayments: (payments: Payment[]) =>
    set((state) => {
      state.items = payments;
    }),

  setLoading: (loading: boolean) =>
    set((state) => {
      state.loading = loading;
    }),

  setError: (error: string | null) =>
    set((state) => {
      state.error = error;
    }),
});
