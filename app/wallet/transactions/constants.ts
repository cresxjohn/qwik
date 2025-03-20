import dayjs from "dayjs";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  account: string;
  paymentDate: string;
  category: string;
  tags: string[];
}

const baseTransactions = [
  {
    name: "Monthly Salary",
    amount: 150000,
    account: "BDO Savings",
    category: "Income",
    tags: ["salary", "regular"],
  },
  {
    name: "Rent Payment",
    amount: -25000,
    account: "BPI Savings",
    category: "Housing",
    tags: ["rent", "monthly"],
  },
  {
    name: "Grocery Shopping",
    amount: -8500,
    account: "BDO Credit Card",
    category: "Food",
    tags: ["groceries", "essentials"],
  },
  {
    name: "Netflix Subscription",
    amount: -499,
    account: "BDO Credit Card",
    category: "Entertainment",
    tags: ["subscription", "streaming"],
  },
  {
    name: "Electricity Bill",
    amount: -3500,
    account: "GCash",
    category: "Utilities",
    tags: ["bills", "monthly"],
  },
  {
    name: "Freelance Project",
    amount: 45000,
    account: "PayPal",
    category: "Income",
    tags: ["freelance", "project"],
  },
  {
    name: "Restaurant Dinner",
    amount: -2500,
    account: "BDO Credit Card",
    category: "Food",
    tags: ["dining", "leisure"],
  },
  {
    name: "Internet Bill",
    amount: -2299,
    account: "GCash",
    category: "Utilities",
    tags: ["bills", "monthly"],
  },
  {
    name: "Investment Deposit",
    amount: -10000,
    account: "COL Financial",
    category: "Investment",
    tags: ["stocks", "investment"],
  },
  {
    name: "Side Project Income",
    amount: 25000,
    account: "PayPal",
    category: "Income",
    tags: ["freelance", "project"],
  },
];

// Deterministic pseudo-random number generator
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export const generateTransactions = (count = 42): Transaction[] => {
  const transactions: Transaction[] = [];
  const today = dayjs().startOf("day");
  let seed = 1;

  // Add test cases first with deterministic dates
  baseTransactions.forEach((base, index) => {
    transactions.push({
      id: `transaction-${index + 1}`,
      ...base,
      paymentDate: today.subtract(index * 2, "day").toISOString(),
    });
  });

  // Generate additional transactions deterministically
  const remainingCount = count - baseTransactions.length;
  for (let i = 0; i < remainingCount; i++) {
    const baseIndex = Math.floor(
      seededRandom(seed++) * baseTransactions.length
    );
    const baseTransaction = baseTransactions[baseIndex];
    const daysAgo = Math.floor(seededRandom(seed++) * 30);
    const amountVariation = 0.8 + seededRandom(seed++) * 0.4;

    transactions.push({
      id: `transaction-${baseTransactions.length + i + 1}`,
      ...baseTransaction,
      paymentDate: today.subtract(daysAgo, "day").toISOString(),
      amount: Math.round(baseTransaction.amount * amountVariation),
    });
  }

  return transactions.sort(
    (a, b) =>
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
};

export const mockTransactions = generateTransactions();
