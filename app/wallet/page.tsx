"use client";

import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Transaction } from "@/shared/types";
import dayjs from "dayjs";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
}

interface CategoryExpense {
  name: string;
  value: number;
}

interface PaymentType {
  name: string;
  value: number;
}

interface SavingsTrend {
  month: string;
  savings: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function Page() {
  const transactions = useSelector(
    (state: RootState) => state.transactions.items
  );
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
  });
  const [chartData, setChartData] = useState({
    monthlyTrends: [] as MonthlyTrend[],
    categoryExpenses: [] as CategoryExpense[],
    paymentTypes: [] as PaymentType[],
    savingsTrend: [] as SavingsTrend[],
  });

  useEffect(() => {
    // Calculate stats from transactions
    const totalExpenses = transactions.reduce(
      (acc: number, curr: Transaction) =>
        acc + (curr.amount < 0 ? Math.abs(curr.amount) : 0),
      0
    );
    const monthlyIncome = transactions.reduce(
      (acc: number, curr: Transaction) =>
        acc + (curr.amount > 0 ? curr.amount : 0),
      0
    );
    const savingsRate = ((monthlyIncome - totalExpenses) / monthlyIncome) * 100;

    setStats({
      totalBalance: monthlyIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses: totalExpenses,
      savingsRate,
    });

    // Prepare chart data
    // 1. Monthly trends
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const month = dayjs()
        .subtract(5 - i, "month")
        .format("MMM");
      const monthTransactions = transactions.filter(
        (t: Transaction) =>
          dayjs(new Date(t.paymentDate)).format("MMM") === month
      );
      const income = monthTransactions
        .filter((t: Transaction) => t.amount > 0)
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter((t: Transaction) => t.amount < 0)
        .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
      return { month, income, expenses };
    });

    // 2. Category expenses
    const categoryMap = transactions.reduce(
      (acc: Record<string, number>, curr: Transaction) => {
        if (curr.amount < 0) {
          acc[curr.category] =
            (acc[curr.category] || 0) + Math.abs(curr.amount);
        }
        return acc;
      },
      {}
    );

    const categoryExpenses = Object.entries(categoryMap).map(
      ([name, value]) => ({
        name,
        value: value as number,
      })
    ) as CategoryExpense[];

    // 3. Payment types
    const recurringExpenses = transactions.reduce(
      (acc: number, curr: Transaction) =>
        acc +
        (curr.tags.includes("monthly") && curr.amount < 0
          ? Math.abs(curr.amount)
          : 0),
      0
    );
    const nonRecurringExpenses = transactions.reduce(
      (acc: number, curr: Transaction) =>
        acc +
        (!curr.tags.includes("monthly") && curr.amount < 0
          ? Math.abs(curr.amount)
          : 0),
      0
    );

    const paymentTypes = [
      { name: "Recurring", value: recurringExpenses },
      { name: "Non-recurring", value: nonRecurringExpenses },
    ];

    // 4. Savings trend
    const savingsTrend = Array.from({ length: 12 }, (_, i) => {
      const month = dayjs()
        .subtract(11 - i, "month")
        .format("MMM");
      const monthTransactions = transactions.filter(
        (t: Transaction) =>
          dayjs(new Date(t.paymentDate)).format("MMM") === month
      );
      const income = monthTransactions
        .filter((t: Transaction) => t.amount > 0)
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter((t: Transaction) => t.amount < 0)
        .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
      return { month, savings: income - expenses };
    });

    setChartData({
      monthlyTrends,
      categoryExpenses,
      paymentTypes,
      savingsTrend,
    });
  }, [transactions]);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/wallet">Wallet</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="p-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Balance</h3>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Monthly Income</h3>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              +4.75% from last month
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Monthly Expenses</h3>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Savings Rate</h3>
            </div>
            <div className="text-2xl font-bold">
              {stats.savingsRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Income vs Expenses Chart */}
          <div className="col-span-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-lg font-medium">Income vs Expenses</h3>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#00C49F"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#FF8042"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-span-3 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-lg font-medium">Recent Transactions</h3>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 4).map((transaction: Transaction) => (
                <div key={transaction.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.account}
                    </p>
                  </div>
                  <div
                    className={`ml-auto font-medium ${
                      transaction.amount > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Spending by Category */}
          <div className="col-span-3 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-lg font-medium">Spending by Category</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.categoryExpenses}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {chartData.categoryExpenses.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Types */}
          <div className="col-span-2 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-lg font-medium">Payment Types</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.paymentTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {chartData.paymentTypes.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Trend */}
          <div className="col-span-2 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-lg font-medium">Savings Trend</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.savingsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
