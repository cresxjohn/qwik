"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Reminder, ReminderType } from "@/shared/types";
import { Bell, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface ReminderSelectProps {
  value: Reminder[];
  onChange: (value: Reminder[]) => void;
  disabled?: boolean;
}

const REMINDER_OPTIONS = [
  { type: "onDay", days: 0, label: "On the day" },
  { type: "before", days: 1, label: "1 day before" },
  { type: "before", days: 2, label: "2 days before" },
  { type: "before", days: 3, label: "3 days before" },
  { type: "before", days: 5, label: "5 days before" },
  { type: "before", days: 7, label: "1 week before" },
  { type: "before", days: 14, label: "2 weeks before" },
  { type: "before", days: 30, label: "1 month before" },
] as const;

export function ReminderSelect({
  value,
  onChange,
  disabled = false,
}: ReminderSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleReminder = (reminder: Reminder) => {
    const exists = value.some(
      (r) => r.type === reminder.type && r.days === reminder.days
    );
    if (exists) {
      onChange(
        value.filter(
          (r) => !(r.type === reminder.type && r.days === reminder.days)
        )
      );
    } else {
      onChange([...value, reminder]);
    }
  };

  const getReminderLabel = (reminder: Reminder) => {
    return (
      REMINDER_OPTIONS.find(
        (option) =>
          option.type === reminder.type && option.days === reminder.days
      )?.label || "Custom reminder"
    );
  };

  return (
    <div className="space-y-2">
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>
                  {value.length === 0
                    ? "Select reminders..."
                    : `${value.length} reminder${
                        value.length === 1 ? "" : "s"
                      }`}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search reminders..." />
              <CommandEmpty>No reminder found.</CommandEmpty>
              <CommandGroup>
                {REMINDER_OPTIONS.map((option) => (
                  <CommandItem
                    key={`${option.type}-${option.days}`}
                    onSelect={() => toggleReminder(option)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.some(
                          (reminder) =>
                            reminder.type === option.type &&
                            reminder.days === option.days
                        )
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((reminder) =>
            disabled ? (
              <Badge
                key={`${reminder.type}-${reminder.days}`}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => !disabled && toggleReminder(reminder)}
              >
                {getReminderLabel(reminder)}
              </Badge>
            ) : (
              <div
                key={`${reminder.type}-${reminder.days}`}
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                <span>{getReminderLabel(reminder)}</span>
                <button
                  type="button"
                  onClick={() => !disabled && toggleReminder(reminder)}
                  className="hover:text-primary/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
