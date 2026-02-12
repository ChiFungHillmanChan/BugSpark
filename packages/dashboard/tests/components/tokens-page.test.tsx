import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import TokensPage from "@/app/(dashboard)/settings/tokens/page";

const mockMutateAsyncCreate = vi.fn();
const mockMutateAsyncDelete = vi.fn();

let mockTokensData: unknown[] = [];
let mockCreateIsPending = false;

vi.mock("@/hooks/use-tokens", () => ({
  useTokens: () => ({
    data: mockTokensData,
    isLoading: false,
  }),
  useCreateToken: () => ({
    mutateAsync: mockMutateAsyncCreate,
    isPending: mockCreateIsPending,
  }),
  useDeleteToken: () => ({
    mutateAsync: mockMutateAsyncDelete,
    isPending: false,
  }),
}));

describe("TokensPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokensData = [];
    mockCreateIsPending = false;
  });

  it("renders the tokens page", async () => {
    renderWithIntl(<TokensPage />);
    await waitFor(() => {
      expect(screen.getByText("Personal Access Tokens")).toBeInTheDocument();
    });
  });

  it("shows error when token creation fails", async () => {
    mockMutateAsyncCreate.mockRejectedValue(new Error("Network error"));
    renderWithIntl(<TokensPage />);

    await waitFor(() => {
      expect(screen.getByText("Create Token")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Create Token"));

    const nameInput = screen.getByPlaceholderText("e.g. My CLI Token");
    await userEvent.type(nameInput, "Test Token");

    await userEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Failed to create token. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows error when token revocation fails", async () => {
    mockTokensData = [
      {
        id: "token-1",
        name: "Test Token",
        tokenPrefix: "bsk_pat_abc",
        lastUsedAt: null,
        expiresAt: null,
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];
    mockMutateAsyncDelete.mockRejectedValue(new Error("Network error"));

    renderWithIntl(<TokensPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Token")).toBeInTheDocument();
    });

    const revokeButton = screen.getByTitle("Revoke");
    await userEvent.click(revokeButton);

    await waitFor(() => {
      expect(screen.getByText("Are you sure you want to revoke this token? It will stop working immediately.")).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByText("Revoke");
    const dialogConfirm = confirmButtons.find(
      (btn) => btn.closest("[role='dialog']") !== null
    );
    if (dialogConfirm) {
      await userEvent.click(dialogConfirm);
    } else {
      const confirmButton = screen.getByText("Revoke", { selector: "button" });
      await userEvent.click(confirmButton);
    }

    await waitFor(() => {
      expect(screen.getByText("Failed to revoke token. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows created token after successful creation", async () => {
    mockMutateAsyncCreate.mockResolvedValue({
      id: "new-token-id",
      name: "New Token",
      token: "bsk_pat_fulltoken123",
      expiresAt: null,
      createdAt: "2026-01-01T00:00:00Z",
    });

    renderWithIntl(<TokensPage />);

    await waitFor(() => {
      expect(screen.getByText("Create Token")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Create Token"));

    const nameInput = screen.getByPlaceholderText("e.g. My CLI Token");
    await userEvent.type(nameInput, "New Token");

    await userEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("bsk_pat_fulltoken123")).toBeInTheDocument();
    });
  });
});
