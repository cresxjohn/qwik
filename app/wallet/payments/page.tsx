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
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { PaymentForm } from "./payment-form";
import { PaymentsTable } from "./payments-table";
import { Payment } from "@/shared/types";

export default function PaymentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();
  const payments = useSelector((state: RootState) => state.payments.items);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    toast.success("Payment created successfully");
  };

  const handleEditSuccess = () => {
    setEditingPayment(undefined);
    toast.success("Payment updated successfully");
  };

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
                <BreadcrumbPage>Payments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground">
              Manage your one-time and recurring payments and subscriptions
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>Add Payment</Button>
        </div>

        <PaymentsTable
          payments={payments}
          onEdit={(payment) => setEditingPayment(payment)}
        />

        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
            <SheetHeader>
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
          <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Payment</SheetTitle>
            </SheetHeader>
            <PaymentForm
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingPayment(undefined)}
              initialData={editingPayment}
            />
          </SheetContent>
        </Sheet>
      </div>
    </SidebarInset>
  );
}
