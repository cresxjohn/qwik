import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentForm } from "../payment-form";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import paymentsReducer from "@/store/slices/paymentsSlice";
import { Payment } from "@/shared/types";

// Mock store setup
const createMockStore = () => {
  return configureStore({
    reducer: {
      payments: paymentsReducer,
    },
  });
};

describe("PaymentForm", () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPaymentForm = (initialData?: Partial<Payment>) => {
    const store = createMockStore();
    return {
      user: userEvent.setup(),
      ...render(
        <Provider store={store}>
          <PaymentForm
            onSuccess={mockOnSuccess}
            onCancel={mockOnCancel}
            initialData={initialData as Payment}
          />
        </Provider>
      ),
    };
  };

  it("renders payment type tabs only on create mode", async () => {
    // Create mode
    const { user } = renderPaymentForm();
    expect(screen.getByRole("tab", { name: /income/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /expense/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /transfer/i })).toBeInTheDocument();

    // Edit mode
    renderPaymentForm({ id: "123", name: "Test Payment" });
    expect(
      screen.queryByRole("tab", { name: /income/i })
    ).not.toBeInTheDocument();
  });

  it("shows/hides toAccount field based on payment type", async () => {
    const { user } = renderPaymentForm();

    // Initially not shown (default is expense)
    expect(screen.queryByLabelText(/to account/i)).not.toBeInTheDocument();

    // Switch to transfer
    await user.click(screen.getByRole("tab", { name: /transfer/i }));
    expect(screen.getByLabelText(/to account/i)).toBeInTheDocument();

    // Switch to income
    await user.click(screen.getByRole("tab", { name: /income/i }));
    expect(screen.queryByLabelText(/to account/i)).not.toBeInTheDocument();
  });

  it("handles amount sign based on payment type", async () => {
    const { user } = renderPaymentForm();
    const amountInput = screen.getByLabelText(/amount/i);

    // Test expense (negative)
    await user.type(amountInput, "100");
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(mockOnSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: -100,
      })
    );

    // Test income (positive)
    await user.click(screen.getByRole("tab", { name: /income/i }));
    await user.clear(amountInput);
    await user.type(amountInput, "100");
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(mockOnSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
      })
    );
  });

  it("validates required fields", async () => {
    const { user } = renderPaymentForm();

    // Try to submit without required fields
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(
      screen.getByText(/please fill in all required fields/i)
    ).toBeInTheDocument();

    // Fill required fields
    await user.type(screen.getByLabelText(/name/i), "Test Payment");
    await user.type(screen.getByLabelText(/amount/i), "100");
    await user.type(screen.getByLabelText(/account/i), "Test Account");
    await user.type(screen.getByLabelText(/category/i), "Test Category");

    // Submit should work now
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("validates transfer-specific fields", async () => {
    const { user } = renderPaymentForm();

    // Switch to transfer
    await user.click(screen.getByRole("tab", { name: /transfer/i }));

    // Fill all fields except toAccount
    await user.type(screen.getByLabelText(/name/i), "Test Transfer");
    await user.type(screen.getByLabelText(/amount/i), "100");
    await user.type(screen.getByLabelText(/from account/i), "Source Account");
    await user.type(screen.getByLabelText(/category/i), "Transfer");

    // Try to submit without toAccount
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(
      screen.getByText(/please specify the destination account/i)
    ).toBeInTheDocument();

    // Fill toAccount
    await user.type(
      screen.getByLabelText(/to account/i),
      "Destination Account"
    );

    // Submit should work now
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("handles recurring payment settings", async () => {
    const { user } = renderPaymentForm();

    // Switch to recurring
    await user.click(screen.getByRole("tab", { name: /recurring payment/i }));

    // Fill required fields
    await user.type(screen.getByLabelText(/name/i), "Test Recurring");
    await user.type(screen.getByLabelText(/amount/i), "100");
    await user.type(screen.getByLabelText(/account/i), "Test Account");
    await user.type(screen.getByLabelText(/category/i), "Test Category");

    // Select frequency
    const frequencySelect = screen.getByRole("combobox", {
      name: /frequency/i,
    });
    await user.click(frequencySelect);
    await user.click(screen.getByText(/monthly/i));

    // Test different end date options
    // 1. Forever (default)
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(mockOnSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        recurring: true,
        frequency: "monthly",
        endDate: undefined,
      })
    );

    // 2. Number of events
    await user.click(screen.getByRole("tab", { name: /number of events/i }));
    await user.type(screen.getByLabelText(/number of events/i), "12");
    await user.click(screen.getByRole("button", { name: /create payment/i }));
    expect(mockOnSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        recurring: true,
        frequency: "monthly",
        endDate: expect.any(String), // Should be calculated date
      })
    );
  });
});
