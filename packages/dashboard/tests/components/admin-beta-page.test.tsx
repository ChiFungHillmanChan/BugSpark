import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import AdminBetaPage from "@/app/(dashboard)/admin/beta/page";

let mockAuthReturn = { isSuperadmin: true, isLoading: false };

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => mockAuthReturn,
}));

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockBetaUsers = {
  items: [
    {
      id: "u1",
      name: "Alice",
      email: "alice@test.com",
      betaStatus: "pending" as const,
      betaReason: "Testing",
      betaAppliedAt: "2024-01-15",
      createdAt: "2024-01-01",
    },
    {
      id: "u2",
      name: "Bob",
      email: "bob@test.com",
      betaStatus: "approved" as const,
      betaReason: null,
      betaAppliedAt: "2024-01-10",
      createdAt: "2024-01-01",
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
};

const mockApproveMutate = vi.fn();
const mockRejectMutate = vi.fn();
const mockUpdateSettingsMutate = vi.fn();

vi.mock("@/hooks/use-admin", () => ({
  useAdminBetaUsers: () => ({ data: mockBetaUsers, isLoading: false }),
  useAdminApproveBeta: () => ({
    mutate: mockApproveMutate,
    isPending: false,
  }),
  useAdminRejectBeta: () => ({ mutate: mockRejectMutate, isPending: false }),
  useAdminSettings: () => ({ data: { betaModeEnabled: true } }),
  useAdminUpdateSettings: () => ({
    mutate: mockUpdateSettingsMutate,
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-debounce", () => ({
  useDebouncedValue: (value: string) => value,
}));

describe("AdminBetaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthReturn = { isSuperadmin: true, isLoading: false };
  });

  it("returns null while auth is loading", () => {
    mockAuthReturn = { isSuperadmin: false, isLoading: true };
    const { container } = renderWithIntl(<AdminBetaPage />);
    expect(container.innerHTML).toBe("");
  });

  it("redirects non-superadmin via router.replace", () => {
    mockAuthReturn = { isSuperadmin: false, isLoading: false };
    renderWithIntl(<AdminBetaPage />);
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders page for superadmin with title and beta user table", () => {
    renderWithIntl(<AdminBetaPage />);
    expect(screen.getByText("Beta Applicants")).toBeInTheDocument();
  });

  it("shows beta users in table", () => {
    renderWithIntl(<AdminBetaPage />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });

  it("shows approve/reject buttons for pending user", () => {
    renderWithIntl(<AdminBetaPage />);
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("does NOT show approve/reject buttons for approved user", () => {
    renderWithIntl(<AdminBetaPage />);
    // There should be exactly one Approve and one Reject button (for Alice only)
    const approveButtons = screen.getAllByText("Approve");
    const rejectButtons = screen.getAllByText("Reject");
    expect(approveButtons).toHaveLength(1);
    expect(rejectButtons).toHaveLength(1);
  });

  it("approve button calls approve mutation with user ID", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AdminBetaPage />);

    await user.click(screen.getByText("Approve"));
    expect(mockApproveMutate).toHaveBeenCalledWith("u1");
  });

  it("reject button calls reject mutation with user ID", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AdminBetaPage />);

    await user.click(screen.getByText("Reject"));
    expect(mockRejectMutate).toHaveBeenCalledWith("u1");
  });

  it("search input exists and is functional", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AdminBetaPage />);

    const searchInput = screen.getByPlaceholderText("Search applicants...");
    expect(searchInput).toBeInTheDocument();

    await user.type(searchInput, "alice");
    expect(searchInput).toHaveValue("alice");
  });

  it("status filter tabs exist", () => {
    renderWithIntl(<AdminBetaPage />);
    expect(screen.getByText("All")).toBeInTheDocument();
    // "Pending" and "Approved" appear both as tabs and status badges, so use getAllByText
    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Approved").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});
