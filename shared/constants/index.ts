export * from "./accounts";
export * from "./categories";

export const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const defaultSettings = {
  paymentsTableColumnVisibility: {
    category: false,
    tags: false,
    nextDueDate: false,
  },
};
