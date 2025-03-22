import { Payment, Reminder } from "@/shared/types";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateEmailContent } from "../route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create a transporter using Zoho SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD, // Use App Password from Zoho
  },
});

// Mock payments data for testing
const mockPayments: Payment[] = [
  {
    id: "1",
    name: "Netflix Subscription",
    amount: 15.99,
    account: "Credit Card",
    paymentType: "expense",
    recurring: true,
    frequency: "monthly",
    startDate: "2024-01-01",
    paymentDate: "2024-03-15",
    lastPaymentDate: "2024-02-15",
    nextDueDate: dayjs().add(1, "day").format("YYYY-MM-DD"), // Tomorrow
    category: "Entertainment",
    tags: ["streaming", "subscription"],
    reminders: [
      { type: "onDay", days: 0 },
      { type: "before", days: 3 },
    ],
  },
  {
    id: "2",
    name: "Gym Membership",
    amount: 49.99,
    account: "Checking Account",
    paymentType: "expense",
    recurring: true,
    frequency: "monthly",
    startDate: "2024-01-01",
    paymentDate: "2024-03-20",
    lastPaymentDate: "2024-02-20",
    nextDueDate: dayjs().add(7, "days").format("YYYY-MM-DD"), // In 7 days
    category: "Health",
    tags: ["fitness", "subscription"],
    reminders: [{ type: "before", days: 7 }],
  },
  {
    id: "3",
    name: "Electricity Bill",
    amount: 89.99,
    account: "Checking Account",
    paymentType: "expense",
    recurring: true,
    frequency: "monthly",
    startDate: "2024-01-01",
    paymentDate: "2024-03-10",
    lastPaymentDate: "2024-02-10",
    nextDueDate: dayjs().subtract(2, "days").format("YYYY-MM-DD"), // Overdue by 2 days
    category: "Utilities",
    tags: ["bills", "utilities"],
    reminders: [{ type: "before", days: 5 }],
  },
];

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify the token and get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const today = dayjs();

    // Filter payments that need reminders today
    const remindersToSend = mockPayments.reduce<
      { payment: Payment; daysUntil: number }[]
    >((acc, payment) => {
      const dueDate = dayjs(payment.nextDueDate);
      const daysUntil = dueDate.diff(today, "day");

      // Check each reminder setting
      payment.reminders?.forEach((reminder: Reminder) => {
        if (
          (reminder.type === "onDay" && daysUntil === 0) ||
          (reminder.type === "before" && daysUntil === reminder.days)
        ) {
          acc.push({ payment, daysUntil });
        }
      });

      return acc;
    }, []);

    // Get overdue payments
    const overduePayments = mockPayments.filter((payment) => {
      const dueDate = dayjs(payment.nextDueDate);
      return dueDate.isBefore(today, "day");
    });

    // If no reminders or overdue payments, exit early
    if (remindersToSend.length === 0 && overduePayments.length === 0) {
      return NextResponse.json({ message: "No reminders to send" });
    }

    // Send email using Zoho SMTP
    await transporter.sendMail({
      from: `Qwikfinx <${process.env.ZOHO_EMAIL}>`,
      to: user.email,
      subject: "Payment Reminders & Updates (Test)",
      html: generateEmailContent(remindersToSend, overduePayments, true),
    });

    return NextResponse.json({
      message: "Test email sent successfully",
      remindersSent: remindersToSend.length,
      overdueCount: overduePayments.length,
      email: user.email,
    });
  } catch (error) {
    console.error("Error sending test reminders:", error);
    return NextResponse.json(
      { error: "Failed to send test reminders", details: error },
      { status: 500 }
    );
  }
}
