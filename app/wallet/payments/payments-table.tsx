"use client";

import { Payment } from "@/shared/types";
import { usePaymentsStore } from "@/store/payments";
import { useSettingsStore } from "@/store/settings";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  type Table as TableInstance,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { PaymentInfo } from "./payment-info";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatRecurrencePattern } from "@/shared/utils";

const SortableHeader = ({
  column,
  children,
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (ascending: boolean) => void;
  };
  children: React.ReactNode;
}) => {
  const isSorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(isSorted === "asc")}
      className="cursor-pointer h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      {isSorted && (
        <span className="ml-2">
          {isSorted === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </span>
      )}
    </Button>
  );
};

interface PaymentsTableProps {
  payments: Payment[];
  onEdit: (payment: Payment) => void;
}

const formatColumnName = (columnId: string) => {
  switch (columnId) {
    case "daysToGo":
      return "Days to Go";
    case "nextDueDate":
      return "Next Due";
    case "endDate":
      return "End Date";
    case "confirmationType":
      return "Confirmation";
    case "paymentType":
      return "Type";
    default:
      // Convert camelCase to normal case with first letter capitalized
      return columnId
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
  }
};

interface ActionCellProps {
  row: { original: Payment };
  table: TableInstance<Payment>;
  onDelete: (id: string) => void;
}

const ActionCell = ({ row, table, onDelete }: ActionCellProps) => {
  const payment = row.original;
  const paymentsStore = usePaymentsStore();
  const onEdit = (table.options.meta as { onEdit?: (payment: Payment) => void })
    ?.onEdit;

  const handleMarkCompleted = () => {
    paymentsStore.markPaymentCompleted(payment.id);
    // Show success message
    import("sonner").then(({ toast }) => {
      toast.success(`Marked "${payment.name}" as completed`);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleMarkCompleted}>
          Mark as completed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(payment)}>
          Edit payment
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-red-600"
              onSelect={(e) => e.preventDefault()}
            >
              Delete payment
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the payment &quot;{payment.name}
                &quot;. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDelete(payment.id);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function PaymentsTable({ payments, onEdit }: PaymentsTableProps) {
  const paymentsStore = usePaymentsStore();
  const settingsStore = useSettingsStore();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  const handleDelete = React.useCallback(
    (id: string) => {
      paymentsStore.deletePayment(id);
    },
    [paymentsStore]
  );

  const columns = React.useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(event) => event.stopPropagation()}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium">{payment.name}</span>
              {payment.link && (
                <a
                  href={payment.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(event) => event.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <SortableHeader column={column}>Category</SortableHeader>
        ),
        cell: ({ row }) => {
          const category = row.getValue("category") as string;
          return <Badge variant="secondary">{category}</Badge>;
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "paymentType",
        header: ({ column }) => (
          <SortableHeader column={column}>Type</SortableHeader>
        ),
        cell: ({ row }) => {
          const paymentType = row.getValue("paymentType") as string;
          const isIncome = paymentType === "income";
          return (
            <Badge
              variant="outline"
              className={
                isIncome
                  ? "bg-green-100 text-green-800 border-green-300"
                  : "bg-orange-100 text-orange-800 border-orange-300"
              }
            >
              {isIncome ? "Income" : "Expense"}
            </Badge>
          );
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <SortableHeader column={column}>Amount</SortableHeader>
        ),
        cell: ({ row }) => {
          const amount = row.getValue("amount") as number;
          const paymentType = row.original.paymentType;
          const isIncome = paymentType === "income";

          return (
            <span
              className={`font-medium ${
                isIncome ? "text-green-600" : "text-orange-600"
              }`}
            >
              {formatCurrency(amount)}
            </span>
          );
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "account",
        header: ({ column }) => (
          <SortableHeader column={column}>Account</SortableHeader>
        ),
        cell: ({ row }) => {
          const account = row.getValue("account") as string | undefined;
          return <div>{account || "-"}</div>;
        },
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Start Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("startDate") as string;
          return <div>{dayjs(date).format("MMM D, YYYY")}</div>;
        },
      },
      {
        accessorKey: "recurring",
        header: ({ column }) => (
          <SortableHeader column={column}>Recurring</SortableHeader>
        ),
        cell: ({ row }) => {
          const recurring = row.getValue("recurring") as boolean | undefined;
          if (!recurring) return null;
          return (
            <Badge variant="outline" className="bg-secondary">
              <RefreshCw className="mr-1 h-3 w-3" />
              Recurring
            </Badge>
          );
        },
      },
      {
        accessorKey: "confirmationType",
        header: ({ column }) => (
          <SortableHeader column={column}>Confirmation</SortableHeader>
        ),
        cell: ({ row }) => {
          const confirmationType = row.getValue("confirmationType") as string;
          const isManual = confirmationType === "manual";
          return (
            <Badge
              variant={isManual ? "secondary" : "outline"}
              className={
                isManual
                  ? "bg-orange-100 text-orange-800"
                  : "bg-green-100 text-green-800"
              }
            >
              {isManual ? "Manual" : "Automatic"}
            </Badge>
          );
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "frequency",
        header: ({ column }) => (
          <SortableHeader column={column}>Frequency</SortableHeader>
        ),
        cell: ({ row }) => {
          const payment = row.original;
          if (!payment.recurring) return null;

          if (payment.recurrence) {
            return <span>{formatRecurrencePattern(payment.recurrence)}</span>;
          } else if ("frequency" in payment && payment.frequency) {
            // Handle legacy frequency
            return (
              <span className="capitalize">{payment.frequency as string}</span>
            );
          }

          return <span>Recurring</span>;
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => (
          <SortableHeader column={column}>End Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("endDate");
          const recurring = row.original.recurring;

          // Show nothing for non-recurring payments
          if (!recurring) return null;

          // Show "Forever" for recurring payments without an end date
          if (!date) {
            return <div className="text-muted-foreground">Forever</div>;
          }

          // Show formatted date for recurring payments with an end date
          const parsedDate =
            date instanceof Date ? date : new Date(date as string);
          if (isNaN(parsedDate.getTime())) return "Invalid date";
          return <div>{dayjs(parsedDate).format("MMM D, YYYY")}</div>;
        },
      },
      {
        accessorKey: "nextDueDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Next Due</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("nextDueDate") as string;
          return (
            <span className="font-medium">
              {dayjs(date).format("MMM D, YYYY")}
            </span>
          );
        },
        enableHiding: true,
        size: 120,
      },
      {
        id: "daysToGo",
        header: ({ column }) => (
          <SortableHeader column={column}>Days to Go</SortableHeader>
        ),
        accessorFn: (row) => {
          const nextDueDate = row.nextDueDate;
          if (!nextDueDate) return null;

          // Use start of day to ensure consistent rendering between server and client
          const today = dayjs().startOf("day");
          const dueDate = dayjs(nextDueDate).startOf("day");
          return dueDate.diff(today, "day");
        },
        cell: ({ getValue }) => {
          const daysToGo = getValue() as number | null;
          if (daysToGo === null) return null;

          if (daysToGo < -1)
            return (
              <div className="text-red-500">
                {Math.abs(daysToGo)} days lapsed
              </div>
            );
          if (daysToGo === -1)
            return <div className="text-red-500">Yesterday</div>;
          if (daysToGo === 0)
            return <div className="text-orange-500">Today</div>;
          if (daysToGo === 1) return <div>Tomorrow</div>;
          return <div>{daysToGo} days to go</div>;
        },
      },
      {
        accessorKey: "tags",
        header: ({ column }) => (
          <SortableHeader column={column}>Tags</SortableHeader>
        ),
        cell: ({ row }) => {
          const tags: string[] = row.getValue("tags");
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row, table }) => (
          <ActionCell row={row} table={table} onDelete={handleDelete} />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
    ],
    [handleDelete]
  );

  const table = useReactTable({
    data: payments,
    columns: columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === "function"
          ? updater(settingsStore.paymentsTableColumnVisibility)
          : updater;
      settingsStore.updatePaymentsTableColumnVisibility(newVisibility);
    },
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility: settingsStore.paymentsTableColumnVisibility,
      rowSelection,
    },
    meta: {
      onEdit,
      onDelete: handleDelete,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const handleExport = () => {
    // Get visible columns
    const visibleColumns = table
      .getAllColumns()
      .filter((column) => column.getIsVisible());

    // Get rows to export (either selected rows or all filtered rows)
    const rowsToExport =
      table.getFilteredSelectedRowModel().rows.length > 0
        ? table.getFilteredSelectedRowModel().rows
        : table.getFilteredRowModel().rows;

    // Create CSV header
    const headers = visibleColumns
      .filter((column) => !["select", "actions"].includes(column.id)) // Exclude select column
      .map((column) => formatColumnName(column.id));

    // Create CSV rows
    const csvData = rowsToExport.map((row) => {
      return (
        visibleColumns
          .filter((column) => !["select", "actions"].includes(column.id)) // Exclude select column
          .map((column) => {
            const value = row.getValue(column.id);

            // Format special values
            if (column.id === "amount") {
              // Remove currency symbol and commas, keep only the number with 2 decimal places
              return Number(value).toFixed(2);
            }
            if (["startDate", "endDate", "nextDueDate"].includes(column.id)) {
              // Handle endDate specially for recurring payments
              if (column.id === "endDate") {
                const payment = row.original;
                if (!payment.recurring) return "";
                if (!value) return "Forever";
                return dayjs(value as Date).format("YYYY-MM-DD");
              }
              return dayjs(value as Date).format("YYYY-MM-DD");
            }
            if (column.id === "tags") {
              // Join tags with underscore
              return (value as string[]).join(";");
            }
            if (column.id === "confirmationType") {
              // Capitalize confirmation type for CSV
              return value === "manual" ? "Manual" : "Automatic";
            }
            if (column.id === "paymentType") {
              // Capitalize payment type for CSV
              return value === "income" ? "Income" : "Expense";
            }
            return value;
          })
          // Escape any fields containing commas with quotes
          .map((value) => {
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`;
            }
            return value;
          })
      );
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `payments_${dayjs().format("YYYY-MM-DD")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full">
            <Input
              placeholder="Filter payments..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-md"
            />
            <Select
              value={
                (table.getColumn("paymentType")?.getFilterValue() as string) ??
                "all"
              }
              onValueChange={(value) => {
                table
                  .getColumn("paymentType")
                  ?.setFilterValue(value === "all" ? undefined : value);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto sm:ml-0">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {formatColumnName(column.id)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    Export
                    {table.getFilteredSelectedRowModel().rows.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 rounded-sm px-1"
                      >
                        {table.getFilteredSelectedRowModel().rows.length}{" "}
                        selected
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Export as CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedPayment(row.original);
                      setIsInfoSheetOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      <PaymentInfo
        payment={selectedPayment}
        open={isInfoSheetOpen}
        onOpenChange={setIsInfoSheetOpen}
        onEdit={onEdit}
        onDelete={(payment) => handleDelete(payment.id)}
      />
    </>
  );
}
