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
import { RichTable } from "@/components/rich-table";
import { Account } from "@/shared/types";
import { mockAccounts } from "@/shared/mock";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline" className="capitalize">
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "balance",
    header: "Balance",
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
  },
  {
    accessorKey: "creditLimit",
    header: "Credit Limit",
    cell: ({ row }) => {
      const creditLimit = row.getValue("creditLimit") as number | null;
      if (!creditLimit) return "-";
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(creditLimit);
    },
  },
  {
    accessorKey: "remainingCreditLimit",
    header: "Available Credit",
    cell: ({ row }) => {
      const remainingCreditLimit = row.getValue("remainingCreditLimit") as
        | number
        | null;
      if (!remainingCreditLimit) return "-";
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(remainingCreditLimit);
    },
  },
  {
    accessorKey: "onHoldAmount",
    header: "On Hold",
    cell: ({ row }) => {
      const onHoldAmount = row.getValue("onHoldAmount") as number;
      if (onHoldAmount === 0) return "-";
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(onHoldAmount);
    },
  },
  {
    accessorKey: "statementDate",
    header: "Statement Date",
    cell: ({ row }) => {
      const statementDate = row.getValue("statementDate") as number | null;
      if (!statementDate) return "-";
      return statementDate;
    },
  },
  {
    accessorKey: "daysDueAfterStatementDate",
    header: "Days Due",
    cell: ({ row }) => {
      const daysDue = row.getValue("daysDueAfterStatementDate") as
        | number
        | null;
      if (!daysDue) return "-";
      return daysDue;
    },
  },
  {
    accessorKey: "annualFee",
    header: "Annual Fee",
    cell: ({ row }) => {
      const annualFee = row.getValue("annualFee") as number | null;
      if (!annualFee) return "-";
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(annualFee);
    },
  },
  {
    accessorKey: "afWaiverSpendingRequirement",
    header: "AF Waiver Requirement",
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
  },
  {
    accessorKey: "excludeFromBalances",
    header: "Excluded",
    cell: ({ row }) => {
      const excluded = row.getValue("excludeFromBalances") as boolean;
      return excluded ? "Yes" : "No";
    },
  },
];

export default function Page() {
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
                <BreadcrumbPage>Accounts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="px-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold mb-1">Accounts</p>
            <p className="text-sm font-light">Manage your accounts.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
        <RichTable
          data={mockAccounts}
          columns={columns}
          enableSelection={true}
          searchPlaceholder="Search accounts..."
          searchColumn="name"
          columnNameMapping={{
            afWaiverSpendingRequirement: "AF Waiver Requirement",
            daysDueAfterStatementDate: "Days Due",
          }}
          defaultColumnVisibility={{
            statementDate: false,
            daysDueAfterStatementDate: false,
            annualFee: false,
            afWaiverSpendingRequirement: false,
            excludeFromBalances: false,
          }}
        />
      </div>
    </SidebarInset>
  );
}
