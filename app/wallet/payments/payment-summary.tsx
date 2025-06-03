"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalOverdue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {overduePayments.length} overdue
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Money In</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalIncomeThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground">
            {upcomingIncomeThisMonth.length > 0
              ? `${upcomingIncomeThisMonth.length} due this month`
              : "none due this month"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Money Out</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalExpensesThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground">
            {upcomingExpensesThisMonth.length > 0
              ? `${upcomingExpensesThisMonth.length} due this month`
              : "none due this month"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transfers</CardTitle>
          <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalTransfersThisMonth)}
          </div>
          <p className="text-xs text-muted-foreground">
            {upcomingTransfersThisMonth.length > 0
              ? `${upcomingTransfersThisMonth.length} due this month`
              : "none due this month"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
