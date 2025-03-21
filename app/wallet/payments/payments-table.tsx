"use client";

import { toast } from "sonner";
import { Payment } from "@/shared/types";
import { deletePayment } from "@/store/slices/paymentsSlice";
import { updatePaymentsTableColumnVisibility } from "@/store/slices/settingsSlice";
import { RootState } from "@/store/store";
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
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const onEdit = (table.options.meta as { onEdit?: (payment: Payment) => void })
    ?.onEdit;

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
        <DropdownMenuItem>Make transaction</DropdownMenuItem>
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

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="flex items-center gap-2">
          <span>{payment.name}</span>
          {payment.link && (
            <a
              href={payment.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <SortableHeader column={column}>Category</SortableHeader>
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      return <div className="capitalize">{category}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <SortableHeader column={column}>Amount</SortableHeader>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      const formatted = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(amount);

      return (
        <div className={amount > 0 ? "text-green-500" : "text-red-500"}>
          {formatted}
        </div>
      );
    },
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
    accessorKey: "frequency",
    header: ({ column }) => (
      <SortableHeader column={column}>Frequency</SortableHeader>
    ),
    cell: ({ row }) => {
      const frequency = row.getValue("frequency") as string | undefined;
      if (!frequency) return null;
      return <div className="capitalize">{frequency}</div>;
    },
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <SortableHeader column={column}>End Date</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = row.getValue("endDate");
      const recurring = row.original.recurring;
      if (!recurring || !date) return null;
      const parsedDate = date instanceof Date ? date : new Date(date as string);
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
      const date = row.getValue("nextDueDate") as Date | undefined;
      if (!date || !(date instanceof Date)) return null;
      return <div>{dayjs(date).format("MMM D, YYYY")}</div>;
    },
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
          <div className="text-red-500">{Math.abs(daysToGo)} days lapsed</div>
        );
      if (daysToGo === -1) return <div className="text-red-500">Yesterday</div>;
      if (daysToGo === 0) return <div className="text-orange-500">Today</div>;
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
    enableHiding: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onDelete: (id: string) => void };
      return <ActionCell row={row} table={table} onDelete={meta.onDelete} />;
    },
  },
];

export function PaymentsTable({ payments, onEdit }: PaymentsTableProps) {
  const dispatch = useDispatch();
  const columnVisibility = useSelector(
    (state: RootState) => state.settings.paymentsTableColumnVisibility
  );
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isInfoSheetOpen, setIsInfoSheetOpen] = useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "daysToGo",
      desc: false,
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  const handleDelete = (id: string) => {
    dispatch(deletePayment(id));
    toast.success("Payment deleted successfully");
  };

  const allColumns = React.useMemo(() => columns, []);

  const table = useReactTable({
    data: payments,
    columns: allColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === "function" ? updater(columnVisibility) : updater;
      dispatch(updatePaymentsTableColumnVisibility(newVisibility));
    },
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onEdit,
      onDelete: handleDelete,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter payments..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
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
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="p-3">
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
                    <TableCell key={cell.id} className="px-3 py-2">
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className={columns.length > 0 ? "space-x-2" : "ml-auto space-x-2"}>
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

      <PaymentInfo
        payment={selectedPayment}
        open={isInfoSheetOpen}
        onOpenChange={setIsInfoSheetOpen}
        onEdit={onEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
