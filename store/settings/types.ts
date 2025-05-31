import { VisibilityState } from "@tanstack/react-table";

export interface SettingsState {
  paymentsTableColumnVisibility: VisibilityState;
}

export interface SettingsActions {
  updatePaymentsTableColumnVisibility: (visibility: VisibilityState) => void;
}

export interface SettingsStore extends SettingsState, SettingsActions {}
