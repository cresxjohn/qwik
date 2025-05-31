import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { PaymentsStore } from "./types";
import { createPaymentsActions } from "./actions";

export const usePaymentsStore = create<PaymentsStore>()(
  persist(
    immer((set, get, store) => ({
      ...createPaymentsActions(set, get, store),
    })),
    {
      name: "payments-storage",
    }
  )
);
