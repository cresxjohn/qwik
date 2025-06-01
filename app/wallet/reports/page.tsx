"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download, BarChart as BarChartIcon } from "lucide-react";
import { RichTable } from "@/components/rich-table";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Mock data for reports
const incomeData = [
  {
    id: "1",
    date: "2024-03-01",
    category: "Salary",
    amount: 50000,
    description: "Monthly salary",
  },
  {
    id: "2",
    date: "2024-03-15",
    category: "Freelance",
    amount: 15000,
    description: "Project payment",
  },
  {
    id: "3",
    date: "2024-03-20",
    category: "Investments",
    amount: 5000,
    description: "Stock dividends",
  },
];

const expenseData = [
  {
    id: "1",
    date: "2024-03-05",
    category: "Housing",
    amount: 15000,
    description: "Rent payment",
  },
  {
    id: "2",
    date: "2024-03-10",
    category: "Food",
    amount: 5000,
    description: "Groceries",
  },
  {
    id: "3",
    date: "2024-03-15",
    category: "Transportation",
    amount: 2000,
    description: "Gas",
  },
];

const savingsData = [
  {
    id: "1",
    date: "2024-03-01",
    amount: 10000,
    category: "Emergency Fund",
    description: "Monthly contribution",
  },
  {
    id: "2",
    date: "2024-03-15",
    amount: 5000,
    category: "Retirement",
    description: "401k contribution",
  },
];

// Mock data for charts
const trendChartData = [
  { date: "2024-01", income: 50000, expenses: 45000 },
  { date: "2024-02", income: 55000, expenses: 48000 },
  { date: "2024-03", income: 60000, expenses: 52000 },
];

const incomeChartData = [
  { category: "Salary", amount: 60000 },
  { category: "Freelance", amount: 20000 },
  { category: "Investments", amount: 15000 },
];

const expenseChartData = [
  { category: "Housing", amount: 25000 },
  { category: "Food", amount: 15000 },
  { category: "Transportation", amount: 8000 },
  { category: "Entertainment", amount: 7000 },
];

const incomeColumns: ColumnDef<(typeof incomeData)[0]>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(amount);
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];

const expenseColumns: ColumnDef<(typeof expenseData)[0]>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(amount);
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];

const savingsColumns: ColumnDef<(typeof savingsData)[0]>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(amount);
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];

export default function Page() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleExport = () => {
    // Create CSV content
    const headers = ["Date", "Category", "Amount", "Description"];
    const rows = [...incomeData, ...expenseData, ...savingsData].map((item) => [
      item.date,
      item.category,
      item.amount,
      item.description,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `financial_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background rounded-4xl flex h-16 shrink-0 items-center gap-2">
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
                  <BreadcrumbPage>Reports</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="px-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold mb-1">Reports</p>
              <p className="text-sm font-light">View your financial reports.</p>
            </div>
            <div className="flex items-center gap-4">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-[300px]"
              />
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  }).format(70000)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  }).format(22000)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  }).format(15000)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Net Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  }).format(48000)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Financial Trends
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData}>
                      <defs>
                        <linearGradient
                          id="incomeGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="expenseGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--destructive))"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--destructive))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="date" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#incomeGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="hsl(var(--destructive))"
                        fillOpacity={1}
                        fill="url(#expenseGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Income Distribution
                </CardTitle>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="category"
                        className="text-muted-foreground"
                      />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Expense Categories
                </CardTitle>
                <BarChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="income" className="space-y-4">
            <TabsList>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>
            <TabsContent value="income" className="space-y-4">
              <RichTable
                data={incomeData}
                columns={incomeColumns}
                enableSelection={true}
                searchPlaceholder="Search income..."
                searchColumn="description"
              />
            </TabsContent>
            <TabsContent value="expenses" className="space-y-4">
              <RichTable
                data={expenseData}
                columns={expenseColumns}
                enableSelection={true}
                searchPlaceholder="Search expenses..."
                searchColumn="description"
              />
            </TabsContent>
            <TabsContent value="savings" className="space-y-4">
              <RichTable
                data={savingsData}
                columns={savingsColumns}
                enableSelection={true}
                searchPlaceholder="Search savings..."
                searchColumn="description"
              />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </>
  );
}
