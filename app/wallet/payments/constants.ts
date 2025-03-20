import dayjs from "dayjs";
import { Payment } from "./payments-table";

type Frequency = "weekly" | "fortnightly" | "monthly" | "quarterly" | "yearly";

const baseServices: Array<
  Omit<Payment, "id" | "startDate" | "lastPaymentDate" | "nextDueDate">
> = [
  // Regular Income
  {
    name: "Monthly Salary",
    amount: 150000,
    account: "Income",
    category: "Salary",
    tags: ["Primary Income", "Employment"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Side Project Income",
    amount: 25000,
    account: "Income",
    category: "Freelance",
    tags: ["Side Income", "Development"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  // Non-recurring Income
  {
    name: "Client Payment",
    amount: 45000,
    account: "Receivables",
    category: "Freelance",
    tags: ["Project", "Development", "One-time"],
    recurring: false,
  },
  {
    name: "Investment Dividend",
    amount: 12500,
    account: "Investment",
    category: "Investment",
    tags: ["Dividend", "Passive Income"],
    recurring: false,
  },
  // Regular Expenses
  {
    name: "Netflix Subscription",
    amount: -549,
    account: "Entertainment",
    category: "Subscription",
    tags: ["Streaming", "Entertainment"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://netflix.com",
  },
  {
    name: "Gym Membership",
    amount: -2500,
    account: "Health & Fitness",
    category: "Health",
    tags: ["Fitness", "Wellness"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Rent Payment",
    amount: -25000,
    account: "Housing",
    category: "Housing",
    tags: ["Rent", "Living Expense", "Essential"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Phone Bill",
    amount: -999,
    account: "Utilities",
    category: "Utility",
    tags: ["Communication", "Essential"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Internet Service",
    amount: -1899,
    account: "Utilities",
    category: "Utility",
    tags: ["Internet", "Essential", "Work"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://globe.com.ph",
  },
  {
    name: "Car Insurance",
    amount: -15000,
    account: "Insurance",
    category: "Insurance",
    tags: ["Vehicle", "Protection"],
    recurring: true,
    frequency: "quarterly" as Frequency,
  },
  {
    name: "Electricity Bill",
    amount: -3500,
    account: "Utilities",
    category: "Utility",
    tags: ["Power", "Essential"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Spotify Premium",
    amount: -194,
    account: "Entertainment",
    category: "Subscription",
    tags: ["Music", "Entertainment"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://spotify.com",
  },
  {
    name: "Amazon Prime",
    amount: -249,
    account: "Entertainment",
    category: "Subscription",
    tags: ["Shopping", "Entertainment", "Streaming"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://amazon.com",
  },
  {
    name: "iCloud Storage",
    amount: -149,
    account: "Cloud Services",
    category: "Subscription",
    tags: ["Storage", "Backup"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://apple.com",
  },
  {
    name: "YouTube Premium",
    amount: -239,
    account: "Entertainment",
    category: "Subscription",
    tags: ["Streaming", "Entertainment"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://youtube.com",
  },
  {
    name: "Disney+ Subscription",
    amount: -159,
    account: "Entertainment",
    category: "Subscription",
    tags: ["Streaming", "Entertainment"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://disneyplus.com",
  },
  {
    name: "Xbox Game Pass",
    amount: -499,
    account: "Entertainment",
    category: "Subscription",
    tags: ["Gaming", "Entertainment"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://xbox.com",
  },
  {
    name: "Adobe Creative Cloud",
    amount: -2590,
    account: "Software",
    category: "Subscription",
    tags: ["Software", "Work", "Creative"],
    recurring: true,
    frequency: "monthly" as Frequency,
    link: "https://adobe.com",
  },
  {
    name: "Home Insurance",
    amount: -3500,
    account: "Insurance",
    category: "Insurance",
    tags: ["Home", "Protection", "Essential"],
    recurring: true,
    frequency: "yearly" as Frequency,
  },
  {
    name: "Water Bill",
    amount: -850,
    account: "Utilities",
    category: "Utility",
    tags: ["Water", "Essential"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Gas Bill",
    amount: -1200,
    account: "Utilities",
    category: "Utility",
    tags: ["Gas", "Essential"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Pet Insurance",
    amount: -1500,
    account: "Insurance",
    category: "Insurance",
    tags: ["Pet", "Protection"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Gym Equipment Rental",
    amount: -1200,
    account: "Health & Fitness",
    category: "Health",
    tags: ["Fitness", "Equipment"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Language Learning App",
    amount: -499,
    account: "Education",
    category: "Subscription",
    tags: ["Learning", "Education"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "Cloud Storage",
    amount: -299,
    account: "Cloud Services",
    category: "Subscription",
    tags: ["Storage", "Backup"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  {
    name: "News Subscription",
    amount: -250,
    account: "News & Media",
    category: "Subscription",
    tags: ["News", "Information"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
  // Non-recurring Expenses
  {
    name: "Emergency Car Repair",
    amount: -15000,
    account: "Auto & Transport",
    category: "Auto",
    tags: ["Car", "Repair", "Emergency"],
    recurring: false,
  },
  {
    name: "Birthday Gift",
    amount: -5000,
    account: "Gifts",
    category: "Shopping",
    tags: ["Gift", "Personal"],
    recurring: false,
  },
  {
    name: "New Laptop",
    amount: -65000,
    account: "Electronics",
    category: "Shopping",
    tags: ["Electronics", "Work", "One-time"],
    recurring: false,
  },
  // Additional items
  {
    name: "Groceries",
    amount: -8000,
    account: "Food",
    category: "Grocery",
    tags: ["Food", "Essential", "Weekly"],
    recurring: true,
    frequency: "weekly" as Frequency,
  },
  {
    name: "Restaurant Dinner",
    amount: -2500,
    account: "Food",
    category: "Dining",
    tags: ["Food", "Entertainment", "One-time"],
    recurring: false,
  },
  {
    name: "Public Transport",
    amount: -1500,
    account: "Transportation",
    category: "Transport",
    tags: ["Travel", "Essential", "Monthly"],
    recurring: true,
    frequency: "monthly" as Frequency,
  },
];

function generatePayments(count: number): Payment[] {
  const today = dayjs();
  const yesterday = today.subtract(1, "day");
  const tomorrow = today.add(1, "day");

  // Specific test cases for important scenarios
  const testCases: Payment[] = [
    // Income test cases
    {
      ...baseServices[0], // Monthly Salary
      id: 1,
      startDate: today.subtract(1, "month").toDate(),
      lastPaymentDate: today.subtract(1, "month").toDate(),
      nextDueDate: today.add(4, "day").toDate(),
      endDate: today.add(11, "month").toDate(), // Contract ends in 1 year
    },
    {
      ...baseServices[1], // Side Project Income
      id: 2,
      startDate: today.subtract(1, "month").toDate(),
      lastPaymentDate: today.subtract(1, "month").toDate(),
      nextDueDate: today.add(7, "day").toDate(),
      endDate: today.add(5, "month").toDate(), // 6-month contract
    },
    // Non-recurring income test cases
    {
      ...baseServices[2], // Client Payment
      id: 3,
      startDate: today.toDate(),
      lastPaymentDate: today.toDate(),
      nextDueDate: today.add(2, "day").toDate(),
    },
    // Expense test cases with specific dates
    {
      ...baseServices[4], // Netflix
      id: 4,
      startDate: yesterday.toDate(),
      lastPaymentDate: yesterday.toDate(),
      nextDueDate: yesterday.toDate(),
      endDate: today.add(11, "month").toDate(), // Annual subscription
    },
    {
      ...baseServices[6], // Rent
      id: 5,
      startDate: today.toDate(),
      lastPaymentDate: today.toDate(),
      nextDueDate: today.toDate(),
      endDate: today.add(5, "month").toDate(), // 6-month lease
    },
    {
      ...baseServices[8], // Internet
      id: 6,
      startDate: tomorrow.toDate(),
      lastPaymentDate: tomorrow.subtract(1, "month").toDate(),
      nextDueDate: tomorrow.toDate(),
      endDate: today.add(23, "month").toDate(), // 2-year contract
    },
    {
      ...baseServices[10], // Electricity
      id: 7,
      startDate: today.subtract(5, "day").toDate(),
      lastPaymentDate: today.subtract(5, "day").toDate(),
      nextDueDate: today.add(25, "day").toDate(),
      endDate: undefined, // No end date for utilities
    },
  ];

  // Generate remaining payments with random variations
  const remainingCount = count - testCases.length;
  const randomPayments: Payment[] = Array.from(
    { length: remainingCount },
    (_, i) => {
      const baseService =
        baseServices[Math.floor(Math.random() * baseServices.length)];
      const randomDays = Math.floor(Math.random() * 30) - 5; // -5 to +25 days
      const startDate = today.subtract(Math.floor(Math.random() * 6), "month");

      // Generate end date for recurring payments
      let endDate: Date | undefined = undefined;
      if (baseService.recurring) {
        const randomMonths = Math.floor(Math.random() * 24) + 1; // 1 to 24 months
        // 30% chance of having no end date
        if (Math.random() > 0.3) {
          endDate = today.add(randomMonths, "month").toDate();
        }
      }

      return {
        ...baseService,
        id: testCases.length + i + 1,
        startDate: startDate.toDate(),
        lastPaymentDate: today
          .subtract(Math.floor(Math.random() * 30), "day")
          .toDate(),
        nextDueDate: today.add(randomDays, "day").toDate(),
        endDate,
      };
    }
  );

  return [...testCases, ...randomPayments];
}

export const mockPayments = generatePayments(42);
