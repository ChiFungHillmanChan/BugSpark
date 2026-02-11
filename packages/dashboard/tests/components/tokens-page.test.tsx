import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import TokensPage from "@/app/(dashboard)/settings/tokens/page";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/api-client", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe("TokensPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
  });

  it("renders the tokens page", async () => {
    renderWithIntl(<TokensPage />);
    await waitFor(() => {
      expect(screen.getByText("Personal Access Tokens")).toBeInTheDocument();
    });
  });

  it("shows error when token creation fails", async () => {
    mockPost.mockRejectedValue(new Error("Network error"));
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
    mockGet.mockResolvedValue({
      data: [
        {
          id: "token-1",
          name: "Test Token",
          tokenPrefix: "bsk_pat_abc",
          lastUsedAt: null,
          expiresAt: null,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
    });
    mockDelete.mockRejectedValue(new Error("Network error"));

    renderWithIntl(<TokensPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Token")).toBeInTheDocument();
    });

    const revokeButton = screen.getByTitle("Revoke");
    await userEvent.click(revokeButton);

    await waitFor(() => {
      expect(screen.getByText("Are you sure you want to revoke this token? It will stop working immediately.")).toBeInTheDocument();
    });

    const confirmButton = screen.getByText("Revoke", { selector: "button" });
    const confirmButtons = screen.getAllByText("Revoke");
    const dialogConfirm = confirmButtons.find(
      (btn) => btn.closest("[role='dialog']") !== null
    );
    if (dialogConfirm) {
      await userEvent.click(dialogConfirm);
    } else {
      await userEvent.click(confirmButton);
    }

    await waitFor(() => {
      expect(screen.getByText("Failed to revoke token. Please try again.")).toBeInTheDocument();
    });
  });

  it("shows created token after successful creation", async () => {
    mockPost.mockResolvedValue({
      data: {
        id: "new-token-id",
        name: "New Token",
        token: "bsk_pat_fulltoken123",
        expiresAt: null,
        createdAt: "2026-01-01T00:00:00Z",
      },
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
