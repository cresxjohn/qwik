"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TestRemindersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTestReminders = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/cron/payment-reminders/test", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test reminders");
      }

      toast.success("Test Email Sent", {
        description: `Sent to ${data.email} with ${data.remindersSent} reminders and ${data.overdueCount} overdue payments.`,
      });
    } catch (error) {
      console.error("Error testing reminders:", error);
      toast.error("Error", {
        description:
          "Failed to send test reminders. Check the console for details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test Payment Reminders</h1>
      <p className="text-muted-foreground mb-6">
        Click the button below to send a test email with payment reminders. This
        will use your current payment data and send it to your registered email
        address.
      </p>
      <Button onClick={handleTestReminders} disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Test Email"}
      </Button>
    </div>
  );
}
