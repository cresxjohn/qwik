import { Payment } from "@/shared/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PaymentsState {
  items: Payment[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentsState = {
  items: [],
  loading: false,
  error: null,
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.items.push(action.payload);
    },
    updatePayment: (state, action: PayloadAction<Payment>) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deletePayment: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addPayment,
  updatePayment,
  deletePayment,
  setPayments,
  setLoading,
  setError,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
