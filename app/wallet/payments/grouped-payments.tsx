"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Payment } from "@/shared/types";
import { formatCurrency, formatRecurrencePattern } from "@/shared/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import { useState } from "react";
import { PaymentInfo } from "./payment-info";

type GroupBy = "dueDate" | "category" | "account";

interface GroupedPaymentsProps {
  payments: Payment[];
  onEdit?: (payment: Payment) => void;
  onDelete?: (id: string) => void;
}

export function GroupedPayments({
  payments,
  onEdit,
  onDelete,
}: GroupedPaymentsProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("dueDate");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentInfoOpen(true);
  };

  const getGroupedPayments = () => {
    const today = dayjs();
    const endOfWeek = today.endOf("week");
    const endOfMonth = today.endOf("month");

    switch (groupBy) {
      case "dueDate":
        const dueDateGroups = {
          today: [] as Payment[],
          thisWeek: [] as Payment[],
          thisMonth: [] as Payment[],
          future: [] as Payment[],
          overdue: [] as Payment[],
        };

        payments.forEach((payment) => {
          const dueDate = dayjs(payment.nextDueDate);
          if (dueDate.isBefore(today, "day")) {
            dueDateGroups.overdue.push(payment);
          } else if (dueDate.isSame(today, "day")) {
            dueDateGroups.today.push(payment);
          } else if (dueDate.isBefore(endOfWeek)) {
            dueDateGroups.thisWeek.push(payment);
          } else if (dueDate.isBefore(endOfMonth)) {
            dueDateGroups.thisMonth.push(payment);
          } else {
            dueDateGroups.future.push(payment);
          }
        });

        return [
          {
            id: "overdue",
            title: "Overdue",
            items: dueDateGroups.overdue,
            variant: "destructive",
          },
          {
            id: "today",
            title: "Due Today",
            items: dueDateGroups.today,
            variant: "default",
          },
          {
            id: "thisWeek",
            title: "Due This Week",
            items: dueDateGroups.thisWeek,
            variant: "default",
          },
          {
            id: "thisMonth",
            title: "Due This Month",
            items: dueDateGroups.thisMonth,
            variant: "default",
          },
          {
            id: "future",
            title: "Future Payments",
            items: dueDateGroups.future,
            variant: "default",
          },
        ].filter((group) => group.items.length > 0);

      case "category":
        const categoryGroups = payments.reduce((groups, payment) => {
          const category = payment.category || "Uncategorized";
          if (!groups[category]) {
            groups[category] = [];
          }
          groups[category].push(payment);
          return groups;
        }, {} as Record<string, Payment[]>);

        return Object.entries(categoryGroups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, items]) => ({
            id: category,
            title: category,
            items,
            variant: "default" as const,
          }));

      case "account":
        const accountGroups = payments.reduce((groups, payment) => {
          const account = payment.account;
          if (!groups[account]) {
            groups[account] = [];
          }
          groups[account].push(payment);
          return groups;
        }, {} as Record<string, Payment[]>);

        return Object.entries(accountGroups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([account, items]) => ({
            id: account,
            title: account,
            items,
            variant: "default" as const,
          }));
    }
  };

  const groups = getGroupedPayments();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Group by:</p>
        <Select
          value={groupBy}
          onValueChange={(value) => setGroupBy(value as GroupBy)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="account">Account</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group.id} className="rounded-lg border">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto p-4 rounded-none hover:bg-muted"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-2">
                {expandedGroups.includes(group.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="font-medium">{group.title}</span>
                <span className="text-sm text-muted-foreground">
                  ({group.items.length})
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(
                  group.items.reduce((sum, item) => sum + item.amount, 0)
                )}
              </span>
            </Button>
            {expandedGroups.includes(group.id) && (
              <div className="border-t divide-y">
                {group.items.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                    onClick={() => handlePaymentClick(payment)}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{payment.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {groupBy !== "dueDate" && (
                          <span>
                            Due {dayjs(payment.nextDueDate).format("MMM D")}
                          </span>
                        )}
                        {groupBy !== "category" && (
                          <span>{payment.category}</span>
                        )}
                        {groupBy !== "account" && (
                          <span>{payment.account}</span>
                        )}
                        {payment.recurring && (
                          <span className="text-primary">
                            {payment.recurrence
                              ? formatRecurrencePattern(payment.recurrence)
                              : "frequency" in payment && payment.frequency
                              ? (payment.frequency as string)
                              : "Recurring"}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            payment.confirmationType === "manual"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {payment.confirmationType === "manual"
                            ? "Manual"
                            : "Auto"}
                        </span>
                      </div>
                    </div>
                    <p className="font-mono">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <PaymentInfo
        payment={selectedPayment}
        open={isPaymentInfoOpen}
        onOpenChange={setIsPaymentInfoOpen}
        onEdit={(payment) => {
          if (onEdit) {
            onEdit(payment);
            setIsPaymentInfoOpen(false);
          }
        }}
        onDelete={(payment) => {
          if (onDelete) {
            onDelete(payment.id);
            setIsPaymentInfoOpen(false);
          }
        }}
      />
    </div>
  );
}
