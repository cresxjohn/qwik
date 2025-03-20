import { faker } from "@faker-js/faker";
import { Transaction } from "../types";
import { TRANSACTION_CATEGORIES, TAGS } from "../constants";

function generateTransaction(): Transaction {
  const type = faker.helpers.arrayElement(["income", "expense"] as const);
  const category = faker.helpers.arrayElement(TRANSACTION_CATEGORIES);
  const numTags = faker.number.int({ min: 1, max: 3 });
  const selectedTags = new Set<string>();

  while (selectedTags.size < numTags) {
    selectedTags.add(faker.helpers.arrayElement(TAGS));
  }

  const amount = faker.number.int({ min: 100, max: 10000 });
  const date = faker.date.recent({ days: 90 });

  return {
    id: faker.string.uuid(),
    name: `${
      type === "income" ? "Received" : "Spent"
    } on ${category.toLowerCase()}`,
    amount: type === "income" ? amount : -amount,
    account: faker.helpers.arrayElement([
      "Main Account",
      "Savings",
      "Credit Card",
      "Cash",
    ]),
    paymentDate: date.toISOString(),
    category,
    type,
    tags: Array.from(selectedTags),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
      probability: 0.3,
    }),
    attachments: faker.helpers.maybe(() => [faker.system.fileName()], {
      probability: 0.2,
    }),
  };
}

function generateTransactions(count = 50): Transaction[] {
  return Array.from({ length: count }, generateTransaction).sort(
    (a, b) =>
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
}

export const mockTransactions = generateTransactions();
