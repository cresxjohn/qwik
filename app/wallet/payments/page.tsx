"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Payment } from "@/shared/types";
import { usePaymentsStore } from "@/store/payments";
import { LayoutGrid, Table } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GroupedPayments } from "./grouped-payments";
import { ImportSheet } from "./import-sheet";
import { PaymentForm } from "./payment-form";
import { PaymentSummary } from "./payment-summary";
import { PaymentsTable } from "./payments-table";

export default function PaymentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();
  const { items: payments, deletePayment } = usePaymentsStore();

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("Payment created successfully");
  };

  const handleEditSuccess = () => {
    setEditingPayment(undefined);
    toast.success("Payment updated successfully");
  };

  const handleDelete = (id: string) => {
    deletePayment(id);
    toast.success("Payment deleted successfully");
  };

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 bg-background sm:rounded-4xl flex h-14 md:h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/wallet">Wallet</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Payments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold mb-1">Payments</p>
              <p className="text-sm font-light">
                Manage your one-time and recurring payments and subscriptions
              </p>
            </div>
            {/* Buttons for larger screens */}
            <div className="hidden sm:flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                Import
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>Add Account</Button>
            </div>
          </div>
          {/* Buttons for smaller screens */}
          <div className="flex sm:hidden gap-2 my-4">
            <Button onClick={() => setIsCreateOpen(true)}>Add Account</Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              Import
            </Button>
          </div>
        </div>

        <PaymentSummary payments={payments} />

        <Tabs defaultValue="grouped" className="space-y-4">
          <div className="flex justify-end">
            <TabsList>
              <TabsTrigger value="grouped">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table">
                <Table className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="grouped" className="space-y-4">
            <GroupedPayments
              payments={payments}
              onEdit={setEditingPayment}
              onDelete={handleDelete}
            />
          </TabsContent>
          <TabsContent value="table" className="space-y-4">
            <PaymentsTable
              payments={payments}
              onEdit={(payment) => setEditingPayment(payment)}
            />
          </TabsContent>
        </Tabs>

        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetContent className="w-full sm:w-[420px] sm:max-w-[420px] overflow-y-auto p-0 gap-0">
            <SheetHeader className="p-4">
              <SheetTitle>Create Payment</SheetTitle>
            </SheetHeader>
            <PaymentForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <Sheet
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(undefined)}
        >
          <SheetContent className="w-full sm:w-[420px] sm:max-w-[420px] overflow-y-auto p-0 gap-0">
            <SheetHeader className="p-4">
              <SheetTitle>Edit Payment</SheetTitle>
            </SheetHeader>
            <PaymentForm
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingPayment(undefined)}
              initialData={editingPayment}
            />
          </SheetContent>
        </Sheet>

        <ImportSheet open={isImportOpen} onOpenChange={setIsImportOpen} />
      </div>
    </SidebarInset>
  );
}
