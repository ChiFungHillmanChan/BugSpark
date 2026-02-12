import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import { PlanSelector } from "@/app/(dashboard)/settings/billing/components/plan-selector";

const mockOnChangePlan = vi.fn();

const MONTHLY = "month";
const YEARLY = "year";

describe("PlanSelector", () => {
  beforeEach(() => {
    mockOnChangePlan.mockClear();
  });

  it("sends 'month' when monthly billing button is clicked", async () => {
    const user = userEvent.setup();
    const plan = { id: "starter", name: "Starter", priceMonthly: 199 };

    renderWithIntl(
      <PlanSelector plan={plan} onChangePlan={mockOnChangePlan} />
    );

    const monthlyButtons = screen.getAllByRole("button", { name: /Monthly/i });
    await user.click(monthlyButtons[0]);

    expect(mockOnChangePlan).toHaveBeenCalledWith(plan, MONTHLY);
  });

  it("sends 'year' when yearly billing button is clicked", async () => {
    const user = userEvent.setup();
    const plan = { id: "starter", name: "Starter", priceYearly: 1990 };

    renderWithIntl(
      <PlanSelector plan={plan} onChangePlan={mockOnChangePlan} />
    );

    const yearlyButtons = screen.getAllByRole("button", { name: /Yearly/i });
    await user.click(yearlyButtons[0]);

    expect(mockOnChangePlan).toHaveBeenCalledWith(plan, YEARLY);
  });

  it("does NOT send 'monthly' (API would reject this)", async () => {
    const user = userEvent.setup();
    const plan = { id: "starter", name: "Starter", priceMonthly: 199 };

    renderWithIntl(
      <PlanSelector plan={plan} onChangePlan={mockOnChangePlan} />
    );

    const monthlyButtons = screen.getAllByRole("button", { name: /Monthly/i });
    await user.click(monthlyButtons[0]);

    // Verify it does NOT send "monthly"
    expect(mockOnChangePlan).not.toHaveBeenCalledWith(
      plan,
      "monthly"
    );
  });

  it("does NOT send 'yearly' (API would reject this)", async () => {
    const user = userEvent.setup();
    const plan = { id: "starter", name: "Starter", priceYearly: 1990 };

    renderWithIntl(
      <PlanSelector plan={plan} onChangePlan={mockOnChangePlan} />
    );

    const yearlyButtons = screen.getAllByRole("button", { name: /Yearly/i });
    await user.click(yearlyButtons[0]);

    // Verify it does NOT send "yearly"
    expect(mockOnChangePlan).not.toHaveBeenCalledWith(
      plan,
      "yearly"
    );
  });
});
