import { Frequency, RecurrencePattern } from "../types";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(weekday);
dayjs.extend(weekOfYear);

// Legacy function for backward compatibility
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

// New function for recurrence patterns
export function calculateNextDueDateFromRecurrence(
  startDate: string,
  recurrence: RecurrencePattern,
  lastPaymentDate?: string
): string {
  const start = dayjs(lastPaymentDate || startDate);

  switch (recurrence.frequency) {
    case "daily":
      return start.add(recurrence.interval, "day").toISOString();

    case "weekly": {
      if (recurrence.weeklyDays && recurrence.weeklyDays.length > 0) {
        // Find the next occurrence on one of the specified days
        let nextDate = start.add(1, "day");
        while (!recurrence.weeklyDays.includes(nextDate.day())) {
          nextDate = nextDate.add(1, "day");
        }
        // If we've gone past the interval, add the remaining weeks
        const weeksDiff = Math.floor(nextDate.diff(start, "week"));
        if (weeksDiff >= recurrence.interval) {
          const additionalWeeks =
            Math.floor(weeksDiff / recurrence.interval) * recurrence.interval;
          nextDate = nextDate.add(additionalWeeks, "week");
        }
        return nextDate.toISOString();
      }
      return start.add(recurrence.interval, "week").toISOString();
    }

    case "monthly": {
      if (recurrence.monthlyType === "date" && recurrence.monthlyDay) {
        // By specific date of month
        let nextDate = start
          .add(recurrence.interval, "month")
          .date(recurrence.monthlyDay);
        // If the day doesn't exist in the month (e.g., Feb 31), use the last day of the month
        if (nextDate.date() !== recurrence.monthlyDay) {
          nextDate = nextDate.endOf("month");
        }
        return nextDate.toISOString();
      } else if (
        recurrence.monthlyType === "day" &&
        recurrence.monthlyWeek !== undefined &&
        recurrence.monthlyWeekDay !== undefined
      ) {
        // By day of week (e.g., first Monday)
        let nextDate = start.add(recurrence.interval, "month");
        if (recurrence.monthlyWeek === -1) {
          // Last occurrence of the day in month
          nextDate = nextDate.endOf("month").day(recurrence.monthlyWeekDay);
          if (nextDate.isAfter(nextDate.endOf("month"))) {
            nextDate = nextDate.subtract(7, "day");
          }
        } else {
          // Nth occurrence of the day in month
          nextDate = nextDate.startOf("month").day(recurrence.monthlyWeekDay);
          if (nextDate.isBefore(nextDate.startOf("month"))) {
            nextDate = nextDate.add(7, "day");
          }
          nextDate = nextDate.add((recurrence.monthlyWeek - 1) * 7, "day");
        }
        return nextDate.toISOString();
      }
      return start.add(recurrence.interval, "month").toISOString();
    }

    case "yearly":
      return start.add(recurrence.interval, "year").toISOString();

    default:
      return start.add(1, "month").toISOString();
  }
}

// Legacy function for backward compatibility
export function calculateNextDueDate(
  startDate: string,
  frequency: Frequency,
  lastPaymentDate?: string
) {
  const start = dayjs(lastPaymentDate || startDate);
  const unit = getFrequencyUnit(frequency);

  // Handle fortnightly and quarterly specially
  switch (frequency) {
    case "fortnightly":
      return start.add(2, "week").toISOString();
    case "quarterly":
      return start.add(3, "month").toISOString();
    default:
      return start.add(1, unit).toISOString();
  }
}

// Helper functions for recurrence pattern creation
export function createWeeklyRecurrence(
  interval: number = 1,
  days: number[] = []
): RecurrencePattern {
  return {
    frequency: "weekly",
    interval,
    weeklyDays: days.length > 0 ? days : undefined,
  };
}

export function createMonthlyByDateRecurrence(
  interval: number = 1,
  day: number
): RecurrencePattern {
  return {
    frequency: "monthly",
    interval,
    monthlyType: "date",
    monthlyDay: day,
  };
}

export function createMonthlyByDayRecurrence(
  interval: number = 1,
  week: number,
  weekDay: number
): RecurrencePattern {
  return {
    frequency: "monthly",
    interval,
    monthlyType: "day",
    monthlyWeek: week,
    monthlyWeekDay: weekDay,
  };
}

export function createYearlyRecurrence(
  interval: number = 1
): RecurrencePattern {
  return {
    frequency: "yearly",
    interval,
  };
}

// Convert legacy frequency to new recurrence pattern
export function legacyToRecurrencePattern(
  frequency: Frequency
): RecurrencePattern {
  switch (frequency) {
    case "weekly":
      return createWeeklyRecurrence(1);
    case "fortnightly":
      return createWeeklyRecurrence(2);
    case "monthly":
      return { frequency: "monthly", interval: 1, monthlyType: "date" };
    case "quarterly":
      return { frequency: "monthly", interval: 3, monthlyType: "date" };
    case "yearly":
      return createYearlyRecurrence(1);
    default:
      return { frequency: "monthly", interval: 1, monthlyType: "date" };
  }
}

// Format recurrence pattern for display
export function formatRecurrencePattern(recurrence: RecurrencePattern): string {
  const { frequency, interval } = recurrence;

  let baseText: string = frequency;
  if (interval > 1) {
    // Proper pluralization for frequency types
    const pluralFrequency = getPluralFrequency(frequency);
    baseText = `every ${interval} ${pluralFrequency}`;
  }

  if (
    frequency === "weekly" &&
    recurrence.weeklyDays &&
    recurrence.weeklyDays.length > 0
  ) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const selectedDays = recurrence.weeklyDays
      .map((day) => dayNames[day])
      .join(", ");
    baseText += ` on ${selectedDays}`;
  }

  if (
    frequency === "monthly" &&
    recurrence.monthlyType === "date" &&
    recurrence.monthlyDay
  ) {
    const ordinal = getOrdinalSuffix(recurrence.monthlyDay);
    baseText += ` on the ${recurrence.monthlyDay}${ordinal}`;
  }

  if (
    frequency === "monthly" &&
    recurrence.monthlyType === "day" &&
    recurrence.monthlyWeek !== undefined &&
    recurrence.monthlyWeekDay !== undefined
  ) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weekNames = ["first", "second", "third", "fourth"];
    const weekName =
      recurrence.monthlyWeek === -1
        ? "last"
        : weekNames[recurrence.monthlyWeek - 1];
    baseText += ` on the ${weekName} ${dayNames[recurrence.monthlyWeekDay]}`;
  }

  return baseText.charAt(0).toUpperCase() + baseText.slice(1);
}

// Helper function to properly pluralize frequency types
function getPluralFrequency(frequency: string): string {
  switch (frequency) {
    case "daily":
      return "days";
    case "weekly":
      return "weeks";
    case "monthly":
      return "months";
    case "yearly":
      return "years";
    default:
      return frequency + "s";
  }
}

function getOrdinalSuffix(num: number): string {
  const remainder = num % 100;
  if (remainder >= 11 && remainder <= 13) {
    return "th";
  }
  switch (num % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
