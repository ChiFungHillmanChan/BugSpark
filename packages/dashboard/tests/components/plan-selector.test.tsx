import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import { PlanSelector } from "@/app/(dashboard)/settings/billing/components/plan-selector";

const mockOnChangePlan = vi.fn();

describe("PlanSelector", () => {
  beforeEach(() => {
    mockOnChangePlan.mockClear();
  });

  it("sends 'month' by default when upgrade is clicked and confirmed", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    // Default is monthly — click the first Upgrade button (Starter card)
    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    await user.click(upgradeButtons[0]);

    // Confirmation dialog opens — click confirm
    const confirmButton = screen.getByRole("button", { name: /Confirm Upgrade/i });
    await user.click(confirmButton);

    expect(mockOnChangePlan).toHaveBeenCalledWith("starter", "month");
  });

  it("sends 'year' when yearly toggle is active and upgrade is confirmed", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    // Switch to yearly billing
    const yearlyToggle = screen.getByRole("button", { name: /Yearly/i });
    await user.click(yearlyToggle);

    // Click the first Upgrade button (Starter card)
    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    await user.click(upgradeButtons[0]);

    // Confirmation dialog opens — click confirm
    const confirmButton = screen.getByRole("button", { name: /Confirm Upgrade/i });
    await user.click(confirmButton);

    expect(mockOnChangePlan).toHaveBeenCalledWith("starter", "year");
  });

  it("does NOT call onChangePlan until confirmation dialog is confirmed", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    await user.click(upgradeButtons[0]);

    // Dialog is open but not yet confirmed
    expect(mockOnChangePlan).not.toHaveBeenCalled();
  });

  it("does NOT send 'monthly' or 'yearly' string (API expects 'month'/'year')", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    await user.click(upgradeButtons[0]);

    const confirmButton = screen.getByRole("button", { name: /Confirm Upgrade/i });
    await user.click(confirmButton);

    expect(mockOnChangePlan).not.toHaveBeenCalledWith("starter", "monthly");
    expect(mockOnChangePlan).not.toHaveBeenCalledWith("starter", "yearly");
  });

  it("shows downgrade button when user is on a paid plan", () => {
    renderWithIntl(
      <PlanSelector currentPlan="starter" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    // Free card should have a Downgrade button
    const downgradeButtons = screen.getAllByRole("button", { name: /Downgrade/i });
    expect(downgradeButtons.length).toBeGreaterThan(0);
  });

  it("hides free plan downgrade when user is already on free", () => {
    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    // Free card should show "Current Plan" label, not a Downgrade button
    expect(screen.queryByRole("button", { name: /Downgrade/i })).toBeNull();
  });

  it("shows current plan label on the active plan card", () => {
    renderWithIntl(
      <PlanSelector currentPlan="starter" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    expect(screen.getByText("Current Plan")).toBeDefined();
  });

  it("shows monthly/yearly toggle with save badge", () => {
    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    expect(screen.getByRole("button", { name: /Monthly/i })).toBeDefined();
    expect(screen.getByText(/Save 17%/i)).toBeDefined();
  });

  it("shows Scheduled badge when a downgrade is pending", () => {
    renderWithIntl(
      <PlanSelector
        currentPlan="team"
        isChanging={false}
        onChangePlan={mockOnChangePlan}
        pendingDowngradePlan="starter"
      />
    );

    expect(screen.getByText("Scheduled")).toBeDefined();
  });

  it("disables downgrade buttons when a downgrade is already pending", () => {
    renderWithIntl(
      <PlanSelector
        currentPlan="team"
        isChanging={false}
        onChangePlan={mockOnChangePlan}
        pendingDowngradePlan="starter"
      />
    );

    const downgradeButtons = screen.getAllByRole("button", { name: /Downgrade/i });
    for (const button of downgradeButtons) {
      expect(button).toHaveProperty("disabled", true);
    }
  });

  it("shows feature lists on plan cards", () => {
    renderWithIntl(
      <PlanSelector currentPlan="free" isChanging={false} onChangePlan={mockOnChangePlan} />
    );

    // Check some representative features are rendered
    expect(screen.getByText("50 reports / month")).toBeDefined();
    expect(screen.getByText("500 reports / month")).toBeDefined();
    expect(screen.getByText("5,000 reports / month")).toBeDefined();
  });
});
