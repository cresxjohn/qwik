"use client";

import { Account, AccountType } from "@/shared/types";
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
import { ArrowDown, ArrowUp, MoreHorizontal, X } from "lucide-react";
import * as React from "react";

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

interface AccountsTableProps {
  accounts: Account[];
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
}

const formatColumnName = (columnId: string) => {
  switch (columnId) {
    case "afWaiverSpendingRequirement":
      return "AF Waiver Requirement";
    case "daysDueAfterStatementDate":
      return "Days Due";
    case "remainingCreditLimit":
      return "Available Credit";
    case "onHoldAmount":
      return "On Hold";
    case "statementDate":
      return "Statement Date";
    case "annualFee":
      return "Annual Fee";
    case "excludeFromBalances":
      return "Excluded";
    case "creditLimit":
      return "Credit Limit";
    case "interestRate":
      return "Interest Rate";
    case "interestFrequency":
      return "Interest Frequency";
    default:
      // Convert camelCase to normal case with first letter capitalized
      return columnId
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
  }
};

interface ActionCellProps {
  row: { original: Account };
  table: TableInstance<Account>;
  onDelete?: (id: string) => void;
}

const ActionCell = ({ row, table, onDelete }: ActionCellProps) => {
  const account = row.original;
  const { onEdit } = table.options.meta as {
    onEdit?: (account: Account) => void;
    onDelete?: (id: string) => void;
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
        <DropdownMenuItem>View transactions</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(account)}>
          Edit account
        </DropdownMenuItem>
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                className="text-red-600"
                onSelect={(e) => e.preventDefault()}
              >
                Delete account
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the account &quot;{account.name}
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
                    onDelete(account.id);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function AccountsTable({
  accounts,
  onEdit,
  onDelete,
}: AccountsTableProps) {
  const settingsStore = useSettingsStore();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [accountTypeFilter, setAccountTypeFilter] = React.useState<string[]>(
    []
  );

  const handleDelete = React.useCallback(
    (id: string) => {
      onDelete?.(id);
    },
    [onDelete]
  );

  // Filter accounts by selected types
  const filteredAccounts = React.useMemo(() => {
    if (accountTypeFilter.length === 0) {
      return accounts;
    }
    return accounts.filter((account) =>
      accountTypeFilter.includes(account.type)
    );
  }, [accounts, accountTypeFilter]);

  // Get unique account types for filter
  const accountTypes = React.useMemo(() => {
    // Define the desired order for account types
    const accountTypeOrder: string[] = [
      "cash",
      "savings",
      "credit card",
      "line of credit",
      "loan",
      "insurance",
    ];

    const types = [
      ...new Set(accounts.map((account) => account.type)),
    ] as AccountType[];

    // Sort types by the defined order
    return accountTypeOrder.filter((type) =>
      types.includes(type as AccountType)
    );
  }, [accounts]);

  const columns = React.useMemo<ColumnDef<Account>[]>(
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
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
        enableHiding: false,
        size: 200,
      },
      {
        accessorKey: "type",
        header: ({ column }) => (
          <SortableHeader column={column}>Type</SortableHeader>
        ),
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          return (
            <Badge variant="outline" className="capitalize">
              {type}
            </Badge>
          );
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "balance",
        header: ({ column }) => (
          <SortableHeader column={column}>Balance</SortableHeader>
        ),
        cell: ({ row }) => {
          const balance = row.getValue("balance") as number;
          const formatted = new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(balance);

          return (
            <div className={balance >= 0 ? "text-green-500" : "text-red-500"}>
              {formatted}
            </div>
          );
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "bankInstitution",
        header: ({ column }) => (
          <SortableHeader column={column}>Bank/Institution</SortableHeader>
        ),
        cell: ({ row }) => {
          const institution = row.getValue("bankInstitution") as string | null;
          if (!institution) return "-";
          return institution;
        },
        enableHiding: true,
        size: 150,
      },
      {
        accessorKey: "interestRate",
        header: ({ column }) => (
          <SortableHeader column={column}>Interest Rate</SortableHeader>
        ),
        cell: ({ row }) => {
          const interestRate = row.getValue("interestRate") as number | null;
          if (!interestRate) return "-";
          return `${interestRate.toFixed(2)}%`;
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "interestFrequency",
        header: ({ column }) => (
          <SortableHeader column={column}>Interest Frequency</SortableHeader>
        ),
        cell: ({ row }) => {
          const frequency = row.getValue("interestFrequency") as string | null;
          if (!frequency) return "-";
          return frequency;
        },
        enableHiding: true,
        size: 130,
      },
      // Credit Card/Line of Credit specific columns
      {
        accessorKey: "creditLimit",
        header: ({ column }) => (
          <SortableHeader column={column}>Credit Limit</SortableHeader>
        ),
        cell: ({ row }) => {
          const creditLimit = row.getValue("creditLimit") as number | null;
          if (!creditLimit) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(creditLimit);
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "remainingCreditLimit",
        header: ({ column }) => (
          <SortableHeader column={column}>Available Credit</SortableHeader>
        ),
        cell: ({ row }) => {
          const remaining = row.getValue("remainingCreditLimit") as
            | number
            | null;
          if (!remaining) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(remaining);
        },
        enableHiding: true,
        size: 130,
      },
      {
        accessorKey: "onHoldAmount",
        header: ({ column }) => (
          <SortableHeader column={column}>On Hold</SortableHeader>
        ),
        cell: ({ row }) => {
          const onHold = row.getValue("onHoldAmount") as number;
          if (!onHold) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(onHold);
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "statementDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Statement Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const statementDate = row.getValue("statementDate") as number | null;
          if (!statementDate) return "-";
          return statementDate;
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "daysDueAfterStatementDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Days Due</SortableHeader>
        ),
        cell: ({ row }) => {
          const daysDue = row.getValue("daysDueAfterStatementDate") as
            | number
            | null;
          if (!daysDue) return "-";
          return daysDue;
        },
        enableHiding: true,
        size: 100,
      },
      {
        accessorKey: "annualFee",
        header: ({ column }) => (
          <SortableHeader column={column}>Annual Fee</SortableHeader>
        ),
        cell: ({ row }) => {
          const annualFee = row.getValue("annualFee") as number | null;
          if (!annualFee) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(annualFee);
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "afWaiverSpendingRequirement",
        header: ({ column }) => (
          <SortableHeader column={column}>AF Waiver Requirement</SortableHeader>
        ),
        cell: ({ row }) => {
          const requirement = row.getValue("afWaiverSpendingRequirement") as
            | number
            | null;
          if (!requirement) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(requirement);
        },
        enableHiding: true,
        size: 180,
      },
      // Loan specific columns
      {
        accessorKey: "originalLoanAmount",
        header: ({ column }) => (
          <SortableHeader column={column}>Original Loan Amount</SortableHeader>
        ),
        cell: ({ row }) => {
          const amount = row.getValue("originalLoanAmount") as number | null;
          if (!amount) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(amount);
        },
        enableHiding: true,
        size: 150,
      },
      {
        accessorKey: "monthlyPaymentAmount",
        header: ({ column }) => (
          <SortableHeader column={column}>Monthly Payment</SortableHeader>
        ),
        cell: ({ row }) => {
          const payment = row.getValue("monthlyPaymentAmount") as number | null;
          if (!payment) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(payment);
        },
        enableHiding: true,
        size: 130,
      },
      {
        accessorKey: "loanType",
        header: ({ column }) => (
          <SortableHeader column={column}>Loan Type</SortableHeader>
        ),
        cell: ({ row }) => {
          const type = row.getValue("loanType") as string | null;
          if (!type) return "-";
          return (
            <Badge variant="secondary" className="capitalize">
              {type}
            </Badge>
          );
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "loanStartDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Loan Start Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("loanStartDate") as string | null;
          if (!date) return "-";
          return dayjs(date).format("MMM D, YYYY");
        },
        enableHiding: true,
        size: 130,
      },
      {
        accessorKey: "maturityDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Maturity Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("maturityDate") as string | null;
          if (!date) return "-";
          return dayjs(date).format("MMM D, YYYY");
        },
        enableHiding: true,
        size: 130,
      },
      {
        accessorKey: "loanTermMonths",
        header: ({ column }) => (
          <SortableHeader column={column}>Loan Term (Months)</SortableHeader>
        ),
        cell: ({ row }) => {
          const term = row.getValue("loanTermMonths") as number | null;
          if (!term) return "-";
          return term;
        },
        enableHiding: true,
        size: 140,
      },
      // Insurance specific columns
      {
        accessorKey: "policyType",
        header: ({ column }) => (
          <SortableHeader column={column}>Policy Type</SortableHeader>
        ),
        cell: ({ row }) => {
          const type = row.getValue("policyType") as string | null;
          if (!type) return "-";
          return (
            <Badge variant="secondary" className="capitalize">
              {type}
            </Badge>
          );
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "premiumAmount",
        header: ({ column }) => (
          <SortableHeader column={column}>Premium Amount</SortableHeader>
        ),
        cell: ({ row }) => {
          const premium = row.getValue("premiumAmount") as number | null;
          if (!premium) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(premium);
        },
        enableHiding: true,
        size: 130,
      },
      {
        accessorKey: "premiumFrequency",
        header: ({ column }) => (
          <SortableHeader column={column}>Premium Frequency</SortableHeader>
        ),
        cell: ({ row }) => {
          const frequency = row.getValue("premiumFrequency") as string | null;
          if (!frequency) return "-";
          return frequency;
        },
        enableHiding: true,
        size: 140,
      },
      {
        accessorKey: "coverageAmount",
        header: ({ column }) => (
          <SortableHeader column={column}>Coverage Amount</SortableHeader>
        ),
        cell: ({ row }) => {
          const coverage = row.getValue("coverageAmount") as number | null;
          if (!coverage) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(coverage);
        },
        enableHiding: true,
        size: 140,
      },
      {
        accessorKey: "policyStartDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Policy Start Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("policyStartDate") as string | null;
          if (!date) return "-";
          return dayjs(date).format("MMM D, YYYY");
        },
        enableHiding: true,
        size: 140,
      },
      {
        accessorKey: "policyEndDate",
        header: ({ column }) => (
          <SortableHeader column={column}>Policy End Date</SortableHeader>
        ),
        cell: ({ row }) => {
          const date = row.getValue("policyEndDate") as string | null;
          if (!date) return "-";
          return dayjs(date).format("MMM D, YYYY");
        },
        enableHiding: true,
        size: 140,
      },
      // Optional fields
      {
        accessorKey: "accountNumber",
        header: ({ column }) => (
          <SortableHeader column={column}>Account Number</SortableHeader>
        ),
        cell: ({ row }) => {
          const number = row.getValue("accountNumber") as string | null;
          if (!number) return "-";
          return `****${number}`;
        },
        enableHiding: true,
        size: 130,
      },
      {
        accessorKey: "minimumBalance",
        header: ({ column }) => (
          <SortableHeader column={column}>Minimum Balance</SortableHeader>
        ),
        cell: ({ row }) => {
          const minimum = row.getValue("minimumBalance") as number | null;
          if (!minimum) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(minimum);
        },
        enableHiding: true,
        size: 140,
      },
      {
        accessorKey: "monthlyMaintenanceFee",
        header: ({ column }) => (
          <SortableHeader column={column}>Monthly Fee</SortableHeader>
        ),
        cell: ({ row }) => {
          const fee = row.getValue("monthlyMaintenanceFee") as number | null;
          if (!fee) return "-";
          return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(fee);
        },
        enableHiding: true,
        size: 120,
      },
      {
        accessorKey: "excludeFromBalances",
        header: ({ column }) => (
          <SortableHeader column={column}>Excluded</SortableHeader>
        ),
        cell: ({ row }) => {
          const excluded = row.getValue("excludeFromBalances") as boolean;
          return excluded ? "Yes" : "No";
        },
        enableHiding: true,
        size: 100,
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
    data: filteredAccounts,
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
          ? updater(settingsStore.accountsTableColumnVisibility)
          : updater;
      settingsStore.updateAccountsTableColumnVisibility(newVisibility);
    },
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility: settingsStore.accountsTableColumnVisibility,
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
      .filter((column) => !["select", "actions"].includes(column.id))
      .map((column) => formatColumnName(column.id));

    // Create CSV rows
    const csvData = rowsToExport.map((row) => {
      return (
        visibleColumns
          .filter((column) => !["select", "actions"].includes(column.id))
          .map((column) => {
            const value = row.getValue(column.id);

            // Format special values
            if (
              [
                "balance",
                "creditLimit",
                "remainingCreditLimit",
                "onHoldAmount",
                "annualFee",
                "afWaiverSpendingRequirement",
              ].includes(column.id)
            ) {
              return value ? Number(value).toFixed(2) : "";
            }
            if (column.id === "interestRate") {
              return value ? `${Number(value).toFixed(2)}%` : "";
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
      `accounts_${dayjs().format("YYYY-MM-DD")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {accountTypeFilter.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {accountTypeFilter.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="capitalize cursor-pointer hover:bg-secondary/80"
              onClick={() => {
                setAccountTypeFilter(
                  accountTypeFilter.filter((t) => t !== type)
                );
              }}
            >
              {type}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAccountTypeFilter([])}
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <Input
            placeholder="Search accounts..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-md"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Account Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Account Types
                {accountTypeFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                    {accountTypeFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Account Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accountTypeFilter.length > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={() => setAccountTypeFilter([])}
                    className="text-sm text-muted-foreground"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear filters
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {accountTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  className="capitalize"
                  checked={accountTypeFilter.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAccountTypeFilter([...accountTypeFilter, type]);
                    } else {
                      setAccountTypeFilter(
                        accountTypeFilter.filter((t) => t !== type)
                      );
                    }
                  }}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
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

          {/* Export Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  Export
                  {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <Badge variant="secondary" className="ml-2 rounded-sm px-1">
                      {table.getFilteredSelectedRowModel().rows.length} selected
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
                  No accounts found.
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
          {accountTypeFilter.length > 0 && (
            <span className="ml-2">
              ({filteredAccounts.length} of {accounts.length} accounts shown)
            </span>
          )}
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
  );
}
