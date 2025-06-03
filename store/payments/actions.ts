import { StateCreator } from "zustand";
import { Payment, Frequency } from "@/shared/types";
import { PaymentsStore } from "./types";
import {
  calculateNextDueDateFromRecurrence,
  calculateNextDueDate,
  legacyToRecurrencePattern,
} from "@/shared/utils";
import dayjs from "dayjs";

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
      // Process the payment to ensure proper recurrence handling
      const processedPayment = processPaymentForStorage(payment);
      state.items.push(processedPayment);
    }),

  updatePayment: (payment: Payment) =>
    set((state) => {
      const index = state.items.findIndex((p) => p.id === payment.id);
      if (index !== -1) {
        // Process the payment to ensure proper recurrence handling
        const processedPayment = processPaymentForStorage(payment);
        state.items[index] = processedPayment;
      }
    }),

  deletePayment: (id: string) =>
    set((state) => {
      state.items = state.items.filter((p) => p.id !== id);
    }),

  setPayments: (payments: Payment[]) =>
    set((state) => {
      // Process all payments to ensure proper recurrence handling
      state.items = payments.map(processPaymentForStorage);
    }),

  setLoading: (loading: boolean) =>
    set((state) => {
      state.loading = loading;
    }),

  setError: (error: string | null) =>
    set((state) => {
      state.error = error;
    }),

  markPaymentCompleted: (id: string, completionDate?: string) =>
    set((state) => {
      const index = state.items.findIndex((p) => p.id === id);
      if (index !== -1) {
        const payment = state.items[index];
        const completedDate = completionDate || dayjs().toISOString();

        // Update last payment date
        payment.lastPaymentDate = completedDate;

        // Calculate next due date for recurring payments
        if (payment.recurring) {
          if (payment.recurrence) {
            payment.nextDueDate = calculateNextDueDateFromRecurrence(
              completedDate,
              payment.recurrence,
              completedDate
            );
          } else if ("frequency" in payment && payment.frequency) {
            // Handle legacy frequency
            payment.nextDueDate = calculateNextDueDate(
              completedDate,
              payment.frequency as Frequency,
              completedDate
            );
          }

          // Check if this payment should end
          if (
            payment.endDate &&
            dayjs(payment.nextDueDate).isAfter(dayjs(payment.endDate))
          ) {
            // Payment series has ended, mark as non-recurring
            payment.recurring = false;
            payment.nextDueDate = payment.endDate;
          }
        }
      }
    }),
});

// Helper function to process payments for proper storage
function processPaymentForStorage(payment: Payment): Payment {
  const processedPayment = { ...payment };

  // Handle legacy frequency conversion
  if ("frequency" in payment && payment.frequency && !payment.recurrence) {
    processedPayment.recurrence = legacyToRecurrencePattern(
      payment.frequency as Frequency
    );
    // Remove the legacy frequency field
    delete (processedPayment as any).frequency;
  }

  // Calculate next due date if this is a recurring payment
  if (processedPayment.recurring && processedPayment.recurrence) {
    // If nextDueDate is not set or is the same as startDate, calculate it
    if (
      !processedPayment.nextDueDate ||
      dayjs(processedPayment.nextDueDate).isSame(
        dayjs(processedPayment.startDate),
        "day"
      )
    ) {
      processedPayment.nextDueDate = calculateNextDueDateFromRecurrence(
        processedPayment.startDate,
        processedPayment.recurrence,
        processedPayment.lastPaymentDate || processedPayment.startDate
      );
    }
  } else if (
    processedPayment.recurring &&
    "frequency" in payment &&
    payment.frequency
  ) {
    // Handle legacy frequency calculation
    processedPayment.nextDueDate = calculateNextDueDate(
      processedPayment.startDate,
      payment.frequency as Frequency,
      processedPayment.lastPaymentDate || processedPayment.startDate
    );
  }

  // Ensure paymentDate is set if not provided
  if (!processedPayment.paymentDate) {
    processedPayment.paymentDate = dayjs(processedPayment.startDate).format(
      "YYYY-MM-DD"
    );
  }

  // Ensure lastPaymentDate is set if not provided
  if (!processedPayment.lastPaymentDate) {
    processedPayment.lastPaymentDate = processedPayment.startDate;
  }

  // For non-recurring payments, nextDueDate should be the same as startDate
  if (!processedPayment.recurring) {
    processedPayment.nextDueDate = processedPayment.startDate;
  }

  // Ensure confirmationType is set (backward compatibility)
  if (!processedPayment.confirmationType) {
    processedPayment.confirmationType = "manual";
  }

  return processedPayment;
}
