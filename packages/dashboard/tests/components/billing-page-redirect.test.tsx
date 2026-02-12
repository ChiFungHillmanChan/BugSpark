import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import BillingPage from "@/app/(dashboard)/settings/billing/page";

// Mock window.location.href
const originalLocation = window.location;
let locationHrefMock = "";

interface CheckoutOptions {
  onSuccess?: (data: { sessionId: string; url?: string }) => void;
  onError?: (error: Error) => void;
}

beforeEach(() => {
  const windowObj = window as unknown as { location: unknown };
  delete windowObj.location;
  window.location = {
    ...originalLocation,
    href: "",
  } as Location;
  locationHrefMock = "";

  Object.defineProperty(window.location, "href", {
    writable: true,
    configurable: true,
    value: locationHrefMock,
  });
});

// Mock the checkout mutation hook
vi.mock("@/hooks/use-billing", () => ({
  useCheckoutSession: () => ({
    mutate: vi.fn((data: unknown, options: CheckoutOptions) => {
      // Simulate successful checkout session creation with sessionId
      if (options?.onSuccess) {
        options.onSuccess({
          sessionId: "cs_test_123456789",
          url: "https://checkout.stripe.com/pay/cs_test_123456789",
        });
      }
    }),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

describe.skip("BillingPage Stripe Redirect", () => {
  it("redirects to Stripe checkout URL after successful session creation", async () => {
    const user = userEvent.setup();
    renderWithIntl(<BillingPage />);

    // Click upgrade button (or similar CTA)
    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    const upgradeButton = upgradeButtons[0];
    await user.click(upgradeButton);

    // Wait for redirect to happen
    await waitFor(() => {
      expect(window.location.href).toMatch(
        /https:\/\/checkout\.stripe\.com\/pay\/cs_test_\d+/
      );
    });
  });

  it("includes correct sessionId in redirect URL", async () => {
    const user = userEvent.setup();
    const sessionId = "cs_test_abc123def456";

    vi.mock("@/hooks/use-billing", () => ({
      useCheckoutSession: () => ({
        mutate: vi.fn((_data: unknown, options: CheckoutOptions) => {
          if (options?.onSuccess) {
            options.onSuccess({ sessionId });
          }
        }),
        isPending: false,
        isError: false,
        error: null,
      }),
    }));

    renderWithIntl(<BillingPage />);
    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    const upgradeButton = upgradeButtons[0];
    await user.click(upgradeButton);

    await waitFor(() => {
      expect(window.location.href).toContain(sessionId);
    });
  });

  it("does NOT redirect if mutation is still pending", async () => {

    vi.mock("@/hooks/use-billing", () => ({
      useCheckoutSession: () => ({
        mutate: vi.fn(),
        isPending: true,
        isError: false,
        error: null,
      }),
    }));

    renderWithIntl(<BillingPage />);
    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    const upgradeButton = upgradeButtons[0];

    expect(upgradeButton).toBeDisabled();
    expect(window.location.href).toBe("");
  });

  it("does NOT redirect if mutation returns error", async () => {
    const user = userEvent.setup();

    vi.mock("@/hooks/use-billing", () => ({
      useCheckoutSession: () => ({
        mutate: vi.fn((_data: unknown, options: CheckoutOptions) => {
          if (options?.onError) {
            options.onError(new Error("Checkout failed"));
          }
        }),
        isPending: false,
        isError: true,
        error: new Error("Checkout failed"),
      }),
    }));

    renderWithIntl(<BillingPage />);
    const upgradeButtons = screen.getAllByRole("button", { name: /Upgrade/i });
    const upgradeButton = upgradeButtons[0];
    await user.click(upgradeButton);

    // Should show error, not redirect
    await waitFor(() => {
      expect(window.location.href).toBe("");
      expect(
        screen.getByText(/checkout failed|error/i)
      ).toBeInTheDocument();
    });
  });
});
