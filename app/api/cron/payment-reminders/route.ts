import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { Payment, Reminder } from "@/shared/types";
import { formatCurrency } from "@/shared/utils";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create a transporter using Zoho SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const today = dayjs();

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email");

    if (usersError) {
      throw new Error("Failed to get users");
    }

    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("*");

    if (paymentsError) {
      throw new Error("Failed to get payments");
    }

    // Process each user's payments
    for (const user of users) {
      const userPayments = payments.filter((p) => p.user_id === user.id);

      // Filter payments that need reminders today
      const remindersToSend = userPayments.reduce<
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
      const overduePayments = userPayments.filter((payment) => {
        const dueDate = dayjs(payment.nextDueDate);
        return dueDate.isBefore(today, "day");
      });

      // If no reminders or overdue payments, skip this user
      if (remindersToSend.length === 0 && overduePayments.length === 0) {
        continue;
      }

      // Send email using Zoho SMTP
      await transporter.sendMail({
        from: `Qwikfinx <${process.env.ZOHO_EMAIL}>`,
        to: user.email,
        subject: "Payment Reminders & Updates",
        html: generateEmailContent(remindersToSend, overduePayments, false),
      });
    }

    return NextResponse.json({
      message: "Payment reminders sent successfully",
    });
  } catch (error) {
    console.error("Error sending payment reminders:", error);
    return NextResponse.json(
      { error: "Failed to send payment reminders" },
      { status: 500 }
    );
  }
}

export function generateEmailContent(
  reminders: { payment: Payment; daysUntil: number }[],
  overduePayments: Payment[],
  isTest: boolean = false
) {
  const totalUpcoming = reminders.reduce(
    (sum, { payment }) => sum + payment.amount,
    0
  );
  const totalOverdue = overduePayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const totalDue = totalUpcoming + totalOverdue;

  // Group payments by category
  const categoryTotals = [
    ...reminders.map((r) => r.payment),
    ...overduePayments,
  ].reduce((acc, payment) => {
    acc[payment.category] = (acc[payment.category] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  // Get highest and lowest amounts
  const allPayments = [...reminders.map((r) => r.payment), ...overduePayments];
  const highestPayment = Math.max(...allPayments.map((p) => p.amount));
  const lowestPayment = Math.min(...allPayments.map((p) => p.amount));

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminders from Qwikfinx</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                ${
                  isTest
                    ? `
                <tr>
                  <td style="background-color: #ef4444; color: #ffffff; text-align: center; padding: 12px; font-size: 14px; font-weight: 500;">
                    This is a test email
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Header -->
                <tr>
                  <td style="background-color: #ffffff; text-align: center; padding: 32px 20px;">
                    <img src="${
                      process.env.NEXT_PUBLIC_APP_URL
                    }/icons/icon-192x192.png" alt="Qwikfinx Logo" width="64" height="64" style="margin-bottom: 16px;">
                    <h1 style="margin: 0 0 8px; font-size: 24px; color: #111827;">Qwikfinx</h1>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${dayjs().format(
                      "MMMM D, YYYY"
                    )}</p>
                  </td>
                </tr>

                <!-- Summary -->
                <tr>
                  <td style="padding: 0 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 0 8px 16px 0;">
                          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Total Due</p>
                            <p style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">${formatCurrency(
                              totalDue
                            )}</p>
                          </div>
                        </td>
                        <td width="50%" style="padding: 0 0 16px 8px;">
                          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
                            <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Overdue Amount</p>
                            <p style="margin: 0; font-size: 24px; font-weight: 600; color: #ef4444;">${formatCurrency(
                              totalOverdue
                            )}</p>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  reminders.length > 0
                    ? `
                <!-- Upcoming Payments -->
                <tr>
                  <td style="padding: 20px;">
                    <div style="background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                      <div style="padding: 16px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                        <h2 style="margin: 0; font-size: 16px; color: #111827;">Upcoming Payments</h2>
                      </div>
                      <div style="padding: 16px;">
                        ${reminders
                          .map(
                            ({ payment, daysUntil }) => `
                        <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
                          <h3 style="margin: 0 0 8px; font-size: 16px; color: #111827;">${
                            payment.name
                          }</h3>
                          <p style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #111827;">${formatCurrency(
                            payment.amount
                          )}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Due ${
                            daysUntil === 0 ? "today" : `in ${daysUntil} days`
                          } (${dayjs(payment.nextDueDate).format(
                              "MMMM D, YYYY"
                            )})</p>
                          <span style="display: inline-block; background-color: #f3f4f6; color: #111827; padding: 4px 12px; border-radius: 9999px; font-size: 12px;">${
                            payment.category
                          }</span>
                        </div>
                        `
                          )
                          .join("")}
                      </div>
                    </div>
                  </td>
                </tr>
                `
                    : ""
                }

                ${
                  overduePayments.length > 0
                    ? `
                <!-- Overdue Payments -->
                <tr>
                  <td style="padding: 0 20px 20px;">
                    <div style="background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                      <div style="padding: 16px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                        <h2 style="margin: 0; font-size: 16px; color: #111827;">Overdue Payments</h2>
                      </div>
                      <div style="padding: 16px;">
                        ${overduePayments
                          .map(
                            (payment) => `
                        <div style="background-color: #ffffff; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #e5e7eb; border-left: 4px solid #ef4444;">
                          <h3 style="margin: 0 0 8px; font-size: 16px; color: #111827;">${
                            payment.name
                          }</h3>
                          <p style="margin: 0 0 8px; font-size: 20px; font-weight: 600; color: #111827;">${formatCurrency(
                            payment.amount
                          )}</p>
                          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Due on ${dayjs(
                            payment.nextDueDate
                          ).format("MMMM D, YYYY")}</p>
                          <span style="display: inline-block; background-color: #f3f4f6; color: #111827; padding: 4px 12px; border-radius: 9999px; font-size: 12px;">${
                            payment.category
                          }</span>
                        </div>
                        `
                          )
                          .join("")}
                      </div>
                    </div>
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Insights -->
                <tr>
                  <td style="padding: 0 20px 20px;">
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                      <h2 style="margin: 0 0 16px; font-size: 16px; color: #111827;">Payment Insights</h2>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Highest Payment</td>
                                <td align="right" style="color: #111827; font-weight: 500; font-size: 16px;">${formatCurrency(
                                  highestPayment
                                )}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Lowest Payment</td>
                                <td align="right" style="color: #111827; font-weight: 500; font-size: 16px;">${formatCurrency(
                                  lowestPayment
                                )}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${Object.entries(categoryTotals)
                          .map(
                            ([category, amount]) => `
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">${category}</td>
                                <td align="right" style="color: #111827; font-weight: 500; font-size: 16px;">${formatCurrency(
                                  amount
                                )}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        `
                          )
                          .join("")}
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Action Button -->
                <tr>
                  <td style="padding: 0 20px 32px; text-align: center;">
                    <a href="${
                      process.env.NEXT_PUBLIC_APP_URL
                    }/wallet/payments" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">View All Payments</a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                    <p style="margin: 0;">This is an automated message from Qwikfinx. Please do not reply to this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
