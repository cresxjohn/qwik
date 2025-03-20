"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import dayjs from "dayjs";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";

export interface Payment {
  id: string;
  name: string;
  amount: number;
  account: string;
  paymentDate: string;
  category: string;
  tags: string[];
  recurring: boolean;
  link?: string;
  nextDueDate?: Date;
}

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
  data: Payment[];
  enableSelection?: boolean;
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
      if (!nextDueDate || !(nextDueDate instanceof Date)) return null;

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
      const tags = row.getValue("tags") as string[];
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
    cell: () => {
      return (
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Make Transaction</DropdownMenuItem>
              <DropdownMenuItem>Edit Payment</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Delete Payment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Dialog>
      );
    },
  },
];

export function PaymentsTable({
  data,
  enableSelection = false,
}: PaymentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "daysToGo",
      desc: false,
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      category: false,
      tags: false,
      nextDueDate: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});

  const allColumns = React.useMemo(() => {
    if (!enableSelection) return columns;
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
    ];
  }, [enableSelection]);

  const table = useReactTable({
    data,
    columns: allColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
        {enableSelection && (
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
        )}
        <div className={enableSelection ? "space-x-2" : "ml-auto space-x-2"}>
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
  );
}
