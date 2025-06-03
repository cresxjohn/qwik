"use client";

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
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/ui/image-viewer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Payment, Frequency } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import {
  formatRecurrencePattern,
  legacyToRecurrencePattern,
} from "@/shared/utils";
import dayjs from "dayjs";
import {
  CalendarIcon,
  CreditCard,
  Edit,
  ExternalLink,
  FileText,
  Hash,
  Link as LinkIcon,
  Repeat,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface PaymentInfoProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10,
    k = num % 100;
  if (j === 1 && k !== 11) {
    return num + "st";
  }
  if (j === 2 && k !== 12) {
    return num + "nd";
  }
  if (j === 3 && k !== 13) {
    return num + "rd";
  }
  return num + "th";
}

export function PaymentInfo({
  payment,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: PaymentInfoProps) {
  if (!payment) return null;

  const formatRecurrenceDisplay = () => {
    if (!payment.recurring) return "One-time Payment";

    if (payment.recurrence) {
      return formatRecurrencePattern(payment.recurrence);
    } else if ("frequency" in payment && payment.frequency) {
      // Handle legacy frequency
      const legacyRecurrence = legacyToRecurrencePattern(
        payment.frequency as Frequency
      );
      return formatRecurrencePattern(legacyRecurrence);
    }

    return "Recurring Payment";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-screen md:max-w-[600px] flex flex-col p-0 gap-0">
        <SheetHeader className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold">
                {payment.name}
              </SheetTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(payment)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(payment)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-lg font-medium">
                  {formatCurrency(payment.amount)}
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
                    Payment Account
                  </p>
                  <p className="font-medium">
                    {payment.account || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Confirmation Type
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {payment.confirmationType === "manual"
                        ? "Manual Confirmation"
                        : "Automatic Confirmation"}
                    </p>
                    <Badge
                      variant={
                        payment.confirmationType === "manual"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        payment.confirmationType === "manual"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      {payment.confirmationType === "manual"
                        ? "Manual"
                        : "Auto"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {payment.confirmationType === "manual"
                      ? "You'll manually mark payments as completed"
                      : "System automatically marks payments as completed"}
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
                    <p className="font-medium">{formatRecurrenceDisplay()}</p>
                    {payment.recurring && (
                      <>
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
                      of each period
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
                    {(payment.attachments || []).map((attachment, index) => (
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
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

        <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="flex justify-end gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                onEdit(payment);
                onOpenChange(false);
              }}
              className="w-full md:w-auto"
            >
              Edit Payment
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full md:w-auto">
                  Delete Payment
                </Button>
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
                      onDelete(payment);
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
