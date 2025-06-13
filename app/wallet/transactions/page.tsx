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
import { TransactionsTable } from "./transactions-table";
import { useTransactionsStore } from "@/store/transactions";

export default function Page() {
  const { items: transactions } = useTransactionsStore();

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 bg-background sm:rounded-4xl flex h-16 shrink-0 items-center gap-2">
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
                <BreadcrumbPage>Transactions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Transactions
              </h2>
              <p className="text-muted-foreground">
                View and manage your transaction history
              </p>
            </div>
          </div>

          <div className="mt-6">
            <TransactionsTable data={transactions} />
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
