"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Frequency, Payment } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import dayjs from "dayjs";
import { Calendar, DollarSign, Repeat, TrendingUp } from "lucide-react";

interface PaymentSummaryProps {
  payments: Payment[];
}

export function PaymentSummary({ payments }: PaymentSummaryProps) {
  const today = dayjs();
  const endOfMonth = today.endOf("month");

  // Calculate total upcoming payments (all future payments)
  const upcomingPayments = payments.filter((payment) =>
    dayjs(payment.nextDueDate).isAfter(today)
  );
  const totalUpcoming = upcomingPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Calculate total due this month
  const dueThisMonth = payments.filter(
    (payment) =>
      dayjs(payment.nextDueDate).isAfter(today) &&
      dayjs(payment.nextDueDate).isBefore(endOfMonth)
  );
  const totalDueThisMonth = dueThisMonth.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Find next payment due
  const nextPayment = [...payments]
    .filter((payment) => dayjs(payment.nextDueDate).isAfter(today))
    .sort((a, b) =>
      dayjs(a.nextDueDate).isBefore(dayjs(b.nextDueDate)) ? -1 : 1
    )[0];

  // Calculate monthly recurring total with new recurrence pattern support
  const monthlyRecurring = payments
    .filter((payment) => payment.recurring)
    .reduce((sum, payment) => {
      let amount = payment.amount;

      if (payment.recurrence) {
        const { frequency, interval } = payment.recurrence;
        switch (frequency) {
          case "daily":
            amount *= 30 / interval; // Approximate monthly equivalent
            break;
          case "weekly":
            amount *= 4 / interval; // 4 weeks per month
            break;
          case "monthly":
            amount /= interval; // Divide by interval for monthly equivalent
            break;
          case "yearly":
            amount /= 12 * interval; // Yearly to monthly
            break;
        }
      } else if ("frequency" in payment && payment.frequency) {
        // Handle legacy frequency
        const legacyFreq = payment.frequency as Frequency;
        switch (legacyFreq) {
          case "weekly":
            amount *= 4;
            break;
          case "fortnightly":
            amount *= 2;
            break;
          case "quarterly":
            amount /= 3;
            break;
          case "yearly":
            amount /= 12;
            break;
          // monthly stays the same
        }
      }

      return sum + amount;
    }, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="mt-0">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">
                  Total Upcoming
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalUpcoming)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {upcomingPayments.length} payments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-0">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-500/10 rounded-full">
                <Calendar className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">
                  Due This Month
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalDueThisMonth)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dueThisMonth.length} payments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-0">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-500/10 rounded-full">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Next Payment</p>
                {nextPayment ? (
                  <>
                    <p className="text-2xl font-bold mt-2">
                      {formatCurrency(nextPayment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {nextPayment.name} on{" "}
                      {dayjs(nextPayment.nextDueDate).format("MMM D")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold mt-2">-</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No upcoming payments
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="mt-0">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Repeat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">
                  Monthly Recurring
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(monthlyRecurring)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {payments.filter((p) => p.recurring).length} active
                  subscriptions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
