"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PaymentType } from "@/shared/types";
import { usePaymentsStore } from "@/store/payments";
import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  paymentType: PaymentType;
  placeholder?: string;
  className?: string;
}

const categoryPresets = {
  income: [
    "Salary",
    "Freelance",
    "Business Income",
    "Investment Returns",
    "Rental Income",
    "Side Hustle",
    "Bonus",
    "Commission",
    "Dividends",
    "Interest",
    "Capital Gains",
    "Royalties",
    "Pension",
    "Social Security",
    "Unemployment Benefits",
    "Tax Refund",
    "Insurance Payout",
    "Gifts & Inheritance",
    "Cashback & Rewards",
    "Contest Winnings",
    "Refunds",
    "Alimony",
    "Child Support",
    "Grants & Scholarships",
    "Other Income",
  ],
  expense: [
    "Food & Dining",
    "Groceries",
    "Restaurants",
    "Fast Food",
    "Entertainment",
    "Movies & Shows",
    "Games & Hobbies",
    "Books & Media",
    "Utilities",
    "Electricity",
    "Water & Sewer",
    "Gas",
    "Internet",
    "Phone",
    "Trash & Recycling",
    "Insurance",
    "Health Insurance",
    "Car Insurance",
    "Home Insurance",
    "Life Insurance",
    "Transportation",
    "Gas & Fuel",
    "Car Maintenance",
    "Public Transit",
    "Parking",
    "Rideshare",
    "Car Payments",
    "Shopping",
    "Clothing",
    "Electronics",
    "Home Improvement",
    "Furniture",
    "Healthcare",
    "Doctor Visits",
    "Pharmacy",
    "Dental",
    "Vision",
    "Therapy",
    "Medical Supplies",
    "Education",
    "Tuition",
    "Books",
    "School Supplies",
    "Training & Courses",
    "Travel",
    "Flights",
    "Hotels",
    "Car Rental",
    "Vacations",
    "Subscriptions",
    "Streaming Services",
    "Software",
    "Magazines",
    "Memberships",
    "Gym & Fitness",
    "Home & Garden",
    "Rent & Mortgage",
    "Property Tax",
    "HOA Fees",
    "Lawn Care",
    "Home Repairs",
    "Personal Care",
    "Haircut",
    "Cosmetics",
    "Spa & Wellness",
    "Gifts & Donations",
    "Birthday Gifts",
    "Holiday Gifts",
    "Charity",
    "Religious Donations",
    "Business Expenses",
    "Office Supplies",
    "Professional Services",
    "Business Travel",
    "Marketing",
    "Equipment",
    "Taxes",
    "Income Tax",
    "Property Tax",
    "Sales Tax",
    "Debt Payments",
    "Credit Card Payments",
    "Student Loans",
    "Personal Loans",
    "Mortgage Payments",
    "Banking Fees",
    "ATM Fees",
    "Account Fees",
    "Investment Fees",
    "Pets",
    "Pet Food",
    "Veterinary",
    "Pet Supplies",
    "Childcare",
    "Babysitting",
    "Daycare",
    "Child Support",
    "Legal & Professional",
    "Attorney Fees",
    "Accounting",
    "Financial Advisor",
    "Other Expenses",
  ],
  transfer: [
    "Savings Transfer",
    "Emergency Fund",
    "Investment Transfer",
    "Retirement Savings",
    "401k Contribution",
    "IRA Contribution",
    "HSA Contribution",
    "College Fund",
    "Vacation Fund",
    "Goal Funding",
    "Account Balance",
    "Debt Payment",
    "Credit Card Payment",
    "Loan Payment",
    "Mortgage Payment",
    "Internal Transfer",
    "Bank Transfer",
    "Investment Rebalancing",
    "Tax Payment",
    "Escrow Transfer",
    "Security Deposit",
    "Other Transfer",
  ],
};

export function CategorySelect({
  value,
  onValueChange,
  paymentType,
  placeholder = "Select or type category...",
  className,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const paymentsStore = usePaymentsStore();

  // Update internal state when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Get custom categories from existing payments, ranked by most recent usage
  const customCategories = useMemo(() => {
    const presetCategories = categoryPresets[paymentType] || [];
    const presetSet = new Set(presetCategories.map((cat) => cat.toLowerCase()));

    // Extract categories from payments of the same type
    const categoryUsage = new Map<string, string>(); // category -> latest lastPaymentDate

    paymentsStore.items
      .filter((payment) => payment.paymentType === paymentType)
      .forEach((payment) => {
        const category = payment.category?.trim();
        if (category && !presetSet.has(category.toLowerCase())) {
          const currentDate = categoryUsage.get(category);
          if (!currentDate || payment.lastPaymentDate > currentDate) {
            categoryUsage.set(category, payment.lastPaymentDate);
          }
        }
      });

    // Sort by most recent usage
    return Array.from(categoryUsage.entries())
      .sort(([, dateA], [, dateB]) => dateB.localeCompare(dateA))
      .map(([category]) => category);
  }, [paymentsStore.items, paymentType]);

  const presetSuggestions = categoryPresets[paymentType] || [];

  // Remove duplicates from preset categories first (case-insensitive)
  const deduplicatedPresets = presetSuggestions.filter(
    (preset, index, arr) =>
      arr.findIndex((item) => item.toLowerCase() === preset.toLowerCase()) ===
      index
  );

  // Remove preset categories that appear in custom categories (case-insensitive)
  const customCategoriesLower = new Set(
    customCategories.map((cat) => cat.toLowerCase())
  );
  const finalPresets = deduplicatedPresets.filter(
    (preset) => !customCategoriesLower.has(preset.toLowerCase())
  );

  // Combine custom categories first (priority), then filtered presets
  const allSuggestions = [...customCategories, ...finalPresets];

  // Check if input matches any suggestion (preset or custom)
  const hasExactMatch = allSuggestions.some(
    (cat) => cat.toLowerCase() === inputValue.toLowerCase()
  );

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onValueChange(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onValueChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate text-left flex-1">
            {inputValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search or type category..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>No suggestions found.</CommandEmpty>
            {/* Show "Use [custom]" option when user has typed something */}
            {inputValue && !hasExactMatch && (
              <CommandGroup>
                <CommandItem
                  value={inputValue}
                  onSelect={() => handleSelect(inputValue)}
                  className="font-medium"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === inputValue ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Use &quot;{inputValue}&quot;
                </CommandItem>
              </CommandGroup>
            )}

            {/* Recent custom categories */}
            {customCategories.length > 0 && (
              <>
                {customCategories.filter((category) =>
                  category.toLowerCase().includes(inputValue.toLowerCase())
                ).length > 0 && (
                  <CommandGroup heading="Recent Categories">
                    {customCategories
                      .filter((category) =>
                        category
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      )
                      .map((category) => (
                        <CommandItem
                          key={`custom-${category}`}
                          value={category}
                          onSelect={() => handleSelect(category)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === category ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {category}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </>
            )}

            {/* Preset categories */}
            {finalPresets.filter((category) =>
              category.toLowerCase().includes(inputValue.toLowerCase())
            ).length > 0 && (
              <CommandGroup heading="Suggested Categories">
                {finalPresets
                  .filter((category) =>
                    category.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((category) => (
                    <CommandItem
                      key={`preset-${category}`}
                      value={category}
                      onSelect={() => handleSelect(category)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === category ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {category}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
