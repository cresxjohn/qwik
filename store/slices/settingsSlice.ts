import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { VisibilityState } from "@tanstack/react-table";

interface SettingsState {
  paymentsTableColumnVisibility: VisibilityState;
}

const initialState: SettingsState = {
  paymentsTableColumnVisibility: {
    category: false,
    tags: false,
    nextDueDate: false,
  },
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updatePaymentsTableColumnVisibility: (
      state,
      action: PayloadAction<VisibilityState>
    ) => {
      state.paymentsTableColumnVisibility = action.payload;
    },
  },
});

export const { updatePaymentsTableColumnVisibility } = settingsSlice.actions;
export default settingsSlice.reducer;
