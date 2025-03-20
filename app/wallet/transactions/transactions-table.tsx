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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Transaction } from "./constants";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, CalendarIcon, ArrowDown, ArrowUp } from "lucide-react";
import dayjs from "dayjs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

function formatColumnName(columnId: string): string {
  switch (columnId) {
    case "paymentDate":
      return "Payment Date";
    default:
      // Convert camelCase to Title Case with spaces
      return columnId
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
  }
}

function AmountRangeFilter({
  column,
}: {
  column: ReturnType<typeof useReactTable<Transaction>>["getColumn"] extends (
    columnId: string
  ) => infer R
    ? R
    : never;
}) {
  const currentFilter = column?.getFilterValue() as
    | [number | undefined, number | undefined]
    | undefined;
  const [min, setMin] = React.useState<string>(
    currentFilter?.[0]?.toString() ?? ""
  );
  const [max, setMax] = React.useState<string>(
    currentFilter?.[1]?.toString() ?? ""
  );

  React.useEffect(() => {
    const filterValue = column?.getFilterValue() as
      | [number | undefined, number | undefined]
      | undefined;
    setMin(filterValue?.[0]?.toString() ?? "");
    setMax(filterValue?.[1]?.toString() ?? "");
  }, [column]);

  const handleMinChange = (value: string) => {
    setMin(value);
    const numValue = value === "" ? undefined : parseFloat(value);
    const maxValue = max === "" ? undefined : parseFloat(max);
    column?.setFilterValue([numValue, maxValue]);
  };

  const handleMaxChange = (value: string) => {
    setMax(value);
    const numValue = value === "" ? undefined : parseFloat(value);
    const minValue = min === "" ? undefined : parseFloat(min);
    column?.setFilterValue([minValue, numValue]);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="min">Minimum</Label>
          <Input
            id="min"
            type="number"
            placeholder="0"
            value={min}
            onChange={(e) => handleMinChange(e.target.value)}
            className="col-span-2"
          />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="max">Maximum</Label>
          <Input
            id="max"
            type="number"
            placeholder="1000000"
            value={max}
            onChange={(e) => handleMaxChange(e.target.value)}
            className="col-span-2"
          />
        </div>
      </div>
      {(min !== "" || max !== "") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMin("");
            setMax("");
            column?.setFilterValue(undefined);
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}

function AccountFilter({
  column,
  data,
}: {
  column: ReturnType<typeof useReactTable<Transaction>>["getColumn"] extends (
    columnId: string
  ) => infer R
    ? R
    : never;
  data: Transaction[];
}) {
  const currentFilter = column?.getFilterValue() as string[] | undefined;
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(
    currentFilter ?? []
  );

  React.useEffect(() => {
    const filterValue = column?.getFilterValue() as string[] | undefined;
    setSelectedAccounts(filterValue ?? []);
  }, [column]);

  const accounts = React.useMemo(() => {
    const uniqueAccounts = new Set<string>();
    data.forEach((transaction) => {
      uniqueAccounts.add(transaction.account);
    });
    return Array.from(uniqueAccounts).sort();
  }, [data]);

  const toggleAccount = (account: string) => {
    const newAccounts = selectedAccounts.includes(account)
      ? selectedAccounts.filter((a) => a !== account)
      : [...selectedAccounts, account];

    setSelectedAccounts(newAccounts);
    column?.setFilterValue(newAccounts.length ? newAccounts : undefined);
  };

  return (
    <div className="grid gap-4">
      <Command className="rounded-lg border shadow-md">
        <CommandGroup>
          {accounts.map((account) => (
            <CommandItem
              key={account}
              onSelect={() => toggleAccount(account)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                  {selectedAccounts.includes(account) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span>{account}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
      {selectedAccounts.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedAccounts([]);
            column?.setFilterValue(undefined);
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}

function CategoryFilter({
  column,
  data,
}: {
  column: ReturnType<typeof useReactTable<Transaction>>["getColumn"] extends (
    columnId: string
  ) => infer R
    ? R
    : never;
  data: Transaction[];
}) {
  const currentFilter = column?.getFilterValue() as string[] | undefined;
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    currentFilter ?? []
  );

  React.useEffect(() => {
    const filterValue = column?.getFilterValue() as string[] | undefined;
    setSelectedCategories(filterValue ?? []);
  }, [column]);

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    data.forEach((transaction) => {
      uniqueCategories.add(transaction.category);
    });
    return Array.from(uniqueCategories).sort();
  }, [data]);

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
    column?.setFilterValue(newCategories.length ? newCategories : undefined);
  };

  return (
    <div className="grid gap-4">
      <Command className="rounded-lg border shadow-md">
        <CommandGroup>
          {categories.map((category) => (
            <CommandItem
              key={category}
              onSelect={() => toggleCategory(category)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                  {selectedCategories.includes(category) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <span>{category}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
      {selectedCategories.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedCategories([]);
            column?.setFilterValue(undefined);
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}

function TagsFilter({
  column,
  data,
}: {
  column: ReturnType<typeof useReactTable<Transaction>>["getColumn"] extends (
    columnId: string
  ) => infer R
    ? R
    : never;
  data: Transaction[];
}) {
  const currentFilter = column?.getFilterValue() as string[] | undefined;
  const [selectedTags, setSelectedTags] = React.useState<string[]>(
    currentFilter ?? []
  );

  React.useEffect(() => {
    const filterValue = column?.getFilterValue() as string[] | undefined;
    setSelectedTags(filterValue ?? []);
  }, [column]);

  const tags = React.useMemo(() => {
    const uniqueTags = new Set<string>();
    data.forEach((transaction) => {
      transaction.tags.forEach((tag) => uniqueTags.add(tag));
    });
    return Array.from(uniqueTags).sort();
  }, [data]);

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    column?.setFilterValue(newTags.length ? newTags : undefined);
  };

  return (
    <div className="grid gap-4">
      <Command className="rounded-lg border shadow-md">
        <CommandGroup>
          {tags.map((tag) => (
            <CommandItem
              key={tag}
              onSelect={() => toggleTag(tag)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                  {selectedTags.includes(tag) && <Check className="h-3 w-3" />}
                </div>
                <span>{tag}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
      {selectedTags.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedTags([]);
            column?.setFilterValue(undefined);
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}

function PaymentDateFilter({
  column,
}: {
  column: ReturnType<typeof useReactTable<Transaction>>["getColumn"] extends (
    columnId: string
  ) => infer R
    ? R
    : never;
}) {
  const currentFilter = column?.getFilterValue() as DateRange | undefined;
  const [date, setDate] = React.useState<DateRange | undefined>(currentFilter);

  React.useEffect(() => {
    const filterValue = column?.getFilterValue() as DateRange | undefined;
    setDate(filterValue);
  }, [column]);

  const handleSelect = (value: DateRange | undefined) => {
    setDate(value);
    column?.setFilterValue(value);
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`justify-start text-left font-normal ${
                !date && "text-muted-foreground"
              }`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {dayjs(date.from).format("MMM D, YYYY")} -{" "}
                    {dayjs(date.to).format("MMM D, YYYY")}
                  </>
                ) : (
                  dayjs(date.from).format("MMM D, YYYY")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      {date && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDate(undefined);
            column?.setFilterValue(undefined);
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
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

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>;
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
        <div
          className={`font-medium ${
            amount > 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {formatted}
        </div>
      );
    },
    filterFn: (row, id, value: [number | undefined, number | undefined]) => {
      const amount = row.getValue(id) as number;
      const [min, max] = value;
      if (min !== undefined && amount < min) return false;
      if (max !== undefined && amount > max) return false;
      return true;
    },
  },
  {
    accessorKey: "account",
    header: ({ column }) => (
      <SortableHeader column={column}>Account</SortableHeader>
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("account")}</div>;
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "paymentDate",
    header: ({ column }) => (
      <SortableHeader column={column}>Payment Date</SortableHeader>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("paymentDate") as string);
      return (
        <div className="font-medium">{dayjs(date).format("MMM D, YYYY")}</div>
      );
    },
    filterFn: (row, id, value: DateRange | undefined) => {
      if (!value?.from) return true;
      const rowDate = dayjs(new Date(row.getValue(id) as string));
      const from = dayjs(value.from);
      const to = value.to ? dayjs(value.to) : from;
      return (
        rowDate.isAfter(from.subtract(1, "day")) &&
        rowDate.isBefore(to.add(1, "day"))
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <SortableHeader column={column}>Category</SortableHeader>
    ),
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("category")}</div>;
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
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
        <div className="flex gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value: string[]) => {
      const tags = row.getValue(id) as string[];
      return value.some((tag) => tags.includes(tag));
    },
  },
];

interface TransactionsTableProps {
  data: Transaction[];
}

export function TransactionsTable({ data }: TransactionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "paymentDate", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [open, setOpen] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
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
    initialState: {
      sorting: [{ id: "paymentDate", desc: true }],
    },
  });

  const amountFilter = table.getColumn("amount")?.getFilterValue() as
    | [number | undefined, number | undefined]
    | undefined;
  const hasAmountFilter =
    amountFilter !== undefined &&
    (amountFilter[0] !== undefined || amountFilter[1] !== undefined);

  const accountFilter = table.getColumn("account")?.getFilterValue() as
    | string[]
    | undefined;
  const hasAccountFilter =
    accountFilter !== undefined && accountFilter.length > 0;

  const dateFilter = table.getColumn("paymentDate")?.getFilterValue() as
    | DateRange
    | undefined;
  const hasDateFilter =
    dateFilter !== undefined && dateFilter.from !== undefined;

  const hasNameFilter =
    ((table.getColumn("name")?.getFilterValue() as string) ?? "").length > 0;

  const categoryFilter = table.getColumn("category")?.getFilterValue() as
    | string[]
    | undefined;
  const hasCategoryFilter =
    categoryFilter !== undefined && categoryFilter.length > 0;

  const tagsFilter = table.getColumn("tags")?.getFilterValue() as
    | string[]
    | undefined;
  const hasTagsFilter = tagsFilter !== undefined && tagsFilter.length > 0;

  const resetAllFilters = () => {
    table.getColumn("amount")?.setFilterValue(undefined);
    table.getColumn("account")?.setFilterValue(undefined);
    table.getColumn("paymentDate")?.setFilterValue(undefined);
    table.getColumn("name")?.setFilterValue(undefined);
    table.getColumn("category")?.setFilterValue(undefined);
    table.getColumn("tags")?.setFilterValue(undefined);
    setOpen(false);
  };

  const activeFilters = [
    hasAmountFilter && "Amount",
    hasAccountFilter && "Account",
    hasDateFilter && "Date",
    hasNameFilter && "Name",
    hasCategoryFilter && "Category",
    hasTagsFilter && "Tags",
  ].filter(Boolean);

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
      .filter((column) => column.id !== "select") // Exclude select column
      .map((column) => formatColumnName(column.id));

    // Create CSV rows
    const csvData = rowsToExport.map((row) => {
      return (
        visibleColumns
          .filter((column) => column.id !== "select") // Exclude select column
          .map((column) => {
            const value = row.getValue(column.id);

            // Format special values
            if (column.id === "amount") {
              // Remove currency symbol and commas, keep only the number with 2 decimal places
              return Number(value).toFixed(2);
            }
            if (column.id === "paymentDate") {
              return dayjs(value as Date).format("YYYY-MM-DD");
            }
            if (column.id === "tags") {
              // Join tags with underscore
              return (value as string[]).join("_");
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
      `transactions_${dayjs().format("YYYY-MM-DD")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center gap-2 py-4 w-full">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
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
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                Filter
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                    {activeFilters.join(", ")}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Transactions</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 p-4">
                <div className="space-y-4">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium">Amount Range</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Filter transactions by minimum and maximum amount values
                      </p>
                    </div>
                    <AmountRangeFilter column={table.getColumn("amount")} />
                  </div>
                  <Separator />
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium">Account</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select one or more accounts to show their transactions
                      </p>
                    </div>
                    <AccountFilter
                      column={table.getColumn("account")}
                      data={data}
                    />
                  </div>
                  <Separator />
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium">Payment Date</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose a date range to filter transactions by payment
                        date
                      </p>
                    </div>
                    <PaymentDateFilter
                      column={table.getColumn("paymentDate")}
                    />
                  </div>
                  <Separator />
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium">Category</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Filter transactions by one or more categories
                      </p>
                    </div>
                    <CategoryFilter
                      column={table.getColumn("category")}
                      data={data}
                    />
                  </div>
                  <Separator />
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium">Tags</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Show transactions that match any of the selected tags
                      </p>
                    </div>
                    <TagsFilter column={table.getColumn("tags")} data={data} />
                  </div>
                  {activeFilters.length > 0 && (
                    <>
                      <Separator />
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={resetAllFilters}
                      >
                        Reset All Filters
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" onClick={handleExport}>
            Export CSV
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                {table.getFilteredSelectedRowModel().rows.length} selected
              </Badge>
            )}
          </Button>
        </div>
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
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
