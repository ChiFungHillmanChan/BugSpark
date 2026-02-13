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

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    const monthlyButtons = screen.getAllByRole("button", { name: /Monthly/i });
    await user.click(monthlyButtons[0]);

    expect(mockOnChangePlan).toHaveBeenCalledWith("starter", MONTHLY);
  });

  it("sends 'year' when yearly billing button is clicked", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    const yearlyButtons = screen.getAllByRole("button", { name: /Yearly/i });
    await user.click(yearlyButtons[0]);

    expect(mockOnChangePlan).toHaveBeenCalledWith("starter", YEARLY);
  });

  it("does NOT send 'monthly' string (API expects 'month')", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    const monthlyButtons = screen.getAllByRole("button", { name: /Monthly/i });
    await user.click(monthlyButtons[0]);

    expect(mockOnChangePlan).not.toHaveBeenCalledWith("starter", "monthly");
  });

  it("does NOT send 'yearly' string (API expects 'year')", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    const yearlyButtons = screen.getAllByRole("button", { name: /Yearly/i });
    await user.click(yearlyButtons[0]);

    expect(mockOnChangePlan).not.toHaveBeenCalledWith("starter", "yearly");
  });

  it("shows downgrade button when user is on a paid plan", () => {
    renderWithIntl(
      <PlanSelector currentPlan="starter" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    expect(screen.getByRole("button", { name: /Downgrade/i })).toBeDefined();
  });

  it("hides free plan when user is already on free", () => {
    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    expect(screen.queryByRole("button", { name: /Downgrade/i })).toBeNull();
  });

  it("disables buttons when isChanging is true", () => {
    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={true} onChangePlan={mockOnChangePlan} />
    );

    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toHaveProperty("disabled", true);
    }
  });
});
