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
import { RootState } from "@/store/store";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { PaymentForm } from "./payment-form";
import { PaymentsTable } from "./payments-table";
import { Payment } from "@/shared/types";
import { ImportSheet } from "./import-sheet";
import { PaymentSummary } from "./payment-summary";
import { GroupedPayments } from "./grouped-payments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deletePayment } from "@/store/slices/paymentsSlice";

export default function PaymentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();
  const payments = useSelector((state: RootState) => state.payments.items);
  const dispatch = useDispatch();

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("Payment created successfully");
  };

  const handleEditSuccess = () => {
    setEditingPayment(undefined);
    toast.success("Payment updated successfully");
  };

  const handleDelete = (id: string) => {
    dispatch(deletePayment(id));
    toast.success("Payment deleted successfully");
  };

  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2">
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground">
              Manage your one-time and recurring payments and subscriptions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="order-last md:order-first"
            >
              Import
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="order-first md:order-last"
            >
              Add Payment
            </Button>
          </div>
        </div>

        <PaymentSummary payments={payments} />

        <Tabs defaultValue="grouped" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grouped">Grouped View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
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
