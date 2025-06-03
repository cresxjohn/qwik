"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Payment } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import dayjs from "dayjs";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  AlertTriangle,
} from "lucide-react";

interface PaymentSummaryProps {
  payments: Payment[];
}

export function PaymentSummary({ payments }: PaymentSummaryProps) {
  const today = dayjs();
  const endOfMonth = today.endOf("month");

  // Calculate total overdue payments (payments where nextDueDate is before today)
  const overduePayments = payments.filter((payment) =>
    dayjs(payment.nextDueDate).isBefore(today)
  );
  const totalOverdue = overduePayments.reduce(
    (sum, payment) => sum + Math.abs(payment.amount),
    0
  );

  // Calculate upcoming income this month
  const upcomingIncomeThisMonth = payments.filter(
    (payment) =>
      payment.paymentType === "income" &&
      dayjs(payment.nextDueDate).isAfter(today) &&
      dayjs(payment.nextDueDate).isBefore(endOfMonth)
  );
  const totalIncomeThisMonth = upcomingIncomeThisMonth.reduce(
    (sum, payment) => sum + Math.abs(payment.amount),
    0
  );

  // Calculate upcoming expenses this month
  const upcomingExpensesThisMonth = payments.filter(
    (payment) =>
      payment.paymentType === "expense" &&
      dayjs(payment.nextDueDate).isAfter(today) &&
      dayjs(payment.nextDueDate).isBefore(endOfMonth)
  );
  const totalExpensesThisMonth = upcomingExpensesThisMonth.reduce(
    (sum, payment) => sum + Math.abs(payment.amount),
    0
  );

  // Calculate upcoming transfers this month
  const upcomingTransfersThisMonth = payments.filter(
    (payment) =>
      payment.paymentType === "transfer" &&
      dayjs(payment.nextDueDate).isAfter(today) &&
      dayjs(payment.nextDueDate).isBefore(endOfMonth)
  );
  const totalTransfersThisMonth = upcomingTransfersThisMonth.reduce(
    (sum, payment) => sum + Math.abs(payment.amount),
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="mt-0">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-500/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Overdue</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalOverdue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overduePayments.length} overdue
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
                <ArrowDownCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Money In</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalIncomeThisMonth)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {upcomingIncomeThisMonth.length > 0
                    ? `${upcomingIncomeThisMonth.length} due this month`
                    : "none due this month"}
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
              <div className="p-2 bg-red-500/10 rounded-full">
                <ArrowUpCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Money Out</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalExpensesThisMonth)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {upcomingExpensesThisMonth.length > 0
                    ? `${upcomingExpensesThisMonth.length} due this month`
                    : "none due this month"}
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
              <div className="p-2 bg-blue-500/10 rounded-full">
                <ArrowRightLeft className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Transfers</p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(totalTransfersThisMonth)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {upcomingTransfersThisMonth.length > 0
                    ? `${upcomingTransfersThisMonth.length} due this month`
                    : "none due this month"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
