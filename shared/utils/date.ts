import { Frequency } from "../types";
import dayjs from "dayjs";

export function getFrequencyUnit(frequency: Frequency) {
  switch (frequency) {
    case "weekly":
      return "week";
    case "monthly":
      return "month";
    case "yearly":
      return "year";
    default:
      return "month";
  }
}

export function formatDate(date: string | Date) {
  return dayjs(date).format("MMM D, YYYY");
}

export function calculateNextDueDate(
  startDate: string,
  frequency: Frequency,
  lastPaymentDate?: string
) {
  const start = dayjs(lastPaymentDate || startDate);
  const unit = getFrequencyUnit(frequency);
  return start.add(1, unit).toISOString();
}
