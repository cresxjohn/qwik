import { faker } from "@faker-js/faker";
import { Account, AccountType } from "../types";
import { ACCOUNT_TYPES, BANK_NAMES } from "../constants";

function generateAccountName(type: AccountType): string {
  const bank = faker.helpers.arrayElement(BANK_NAMES);

  switch (type) {
    case "cash":
      return `${bank} Cash`;
    case "savings":
      return `${bank} Savings`;
    case "credit card":
      const cardTypes = ["Platinum", "Gold", "Titanium", "World", "Signature"];
      const cardType = faker.helpers.arrayElement(cardTypes);
      return `${bank} ${cardType} Card`;
    case "line of credit":
      return `${bank} Credit Line`;
    case "loan":
      const loanTypes = ["Personal", "Home", "Auto", "Business"];
      const loanType = faker.helpers.arrayElement(loanTypes);
      return `${bank} ${loanType} Loan`;
    case "insurance":
      const insuranceTypes = ["Life", "Health", "Investment", "VUL"];
      const insuranceType = faker.helpers.arrayElement(insuranceTypes);
      return `${bank} ${insuranceType} Insurance`;
    default:
      return bank;
  }
}

function generateAccount(): Account {
  const type = faker.helpers.arrayElement(ACCOUNT_TYPES);
  const isCreditType =
    type === "credit card" || type === "line of credit" || type === "loan";
  const creditLimit = isCreditType
    ? faker.number.int({ min: 50000, max: 1000000 })
    : null;
  const onHoldAmount = isCreditType
    ? faker.number.int({ min: 0, max: 10000 })
    : 0;

  let balance: number;
  if (isCreditType) {
    balance = -faker.number.int({ min: 0, max: creditLimit! });
  } else if (type === "insurance") {
    balance = faker.number.int({ min: 100000, max: 5000000 });
  } else {
    balance = faker.number.int({ min: 1000, max: 500000 });
  }

  return {
    id: faker.string.uuid(),
    name: generateAccountName(type),
    balance,
    type,
    creditLimit,
    onHoldAmount,
    remainingCreditLimit: creditLimit
      ? creditLimit + balance - onHoldAmount
      : null,
    statementDate: isCreditType ? faker.number.int({ min: 1, max: 28 }) : null,
    daysDueAfterStatementDate: isCreditType
      ? faker.number.int({ min: 15, max: 25 })
      : null,
    annualFee: isCreditType ? faker.number.int({ min: 1500, max: 6000 }) : null,
    afWaiverSpendingRequirement: isCreditType
      ? faker.number.int({ min: 50000, max: 200000 })
      : null,
    excludeFromBalances: faker.datatype.boolean(),
  };
}

function generateAccounts(count = 10): Account[] {
  return Array.from({ length: count }, generateAccount).sort((a, b) => {
    // Sort by type first
    const typeOrder =
      ACCOUNT_TYPES.indexOf(a.type) - ACCOUNT_TYPES.indexOf(b.type);
    if (typeOrder !== 0) return typeOrder;

    // Then by name
    return a.name.localeCompare(b.name);
  });
}

export const mockAccounts = generateAccounts();
