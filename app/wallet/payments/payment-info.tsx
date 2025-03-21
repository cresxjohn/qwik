"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageViewer } from "@/components/ui/image-viewer";
import dayjs from "dayjs";
import { CalendarIcon, CreditCard, Link as LinkIcon, Tag } from "lucide-react";
import { Payment } from "@/shared/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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

interface PaymentInfoProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
}

function getOrdinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

export function PaymentInfo({
  payment,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: PaymentInfoProps) {
  if (!payment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{payment.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 mt-6 space-y-8 px-4 pb-24">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-medium">
                  ${payment.amount.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-medium capitalize">
                  {payment.category}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Method
                  </p>
                  <p className="font-medium">
                    {payment.account || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Payment Schedule
                  </p>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {payment.recurring
                        ? "Recurring Payment"
                        : "One-time Payment"}
                    </p>
                    {payment.recurring && (
                      <>
                        <p className="text-sm">
                          Frequency:{" "}
                          {payment.frequency?.charAt(0).toUpperCase()}
                          {payment.frequency?.slice(1)}
                        </p>
                        <p className="text-sm">
                          Start Date:{" "}
                          {dayjs(payment.startDate).format("MMM D, YYYY")}
                        </p>
                        {payment.endDate && (
                          <p className="text-sm">
                            End Date:{" "}
                            {dayjs(payment.endDate).format("MMM D, YYYY")}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Payment Dates</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      Last Payment:{" "}
                      {dayjs(payment.lastPaymentDate).format("MMM D, YYYY")}
                    </p>
                    <p className="text-sm">
                      Next Due:{" "}
                      {dayjs(payment.nextDueDate).format("MMM D, YYYY")}
                    </p>
                    <p className="text-sm">
                      Payment Day: {dayjs(payment.paymentDate).format("D")}
                      {getOrdinalSuffix(
                        parseInt(dayjs(payment.paymentDate).format("D"))
                      )}{" "}
                      of each {payment.frequency || "month"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="space-y-4">
              {payment.link && (
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment Link
                    </p>
                    <a
                      href={payment.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {payment.link}
                    </a>
                  </div>
                </div>
              )}

              {payment.tags && payment.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {payment.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {payment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{payment.notes}</p>
                </div>
              )}

              {payment.attachments && payment.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Attachments
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {payment.attachments.map((attachment, index) => (
                      <ImageViewer
                        key={index}
                        images={payment.attachments || []}
                        initialIndex={index}
                        trigger={
                          <div className="relative aspect-square rounded-lg border bg-muted overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                            <Image
                              src={attachment}
                              alt={`Attachment ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onEdit(payment);
                onOpenChange(false);
              }}
            >
              Edit Payment
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Payment</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the payment &quot;
                    {payment.name}&quot;. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDelete(payment.id);
                      onOpenChange(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
