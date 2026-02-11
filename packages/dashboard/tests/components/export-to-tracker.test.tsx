import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import { ExportToTracker } from "@/components/bug-detail/export-to-tracker";

let mockHookReturn: {
  mutate: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

vi.mock("@/hooks/use-integrations", () => ({
  useExportToTracker: () => mockHookReturn,
}));

vi.mock("@/components/shared/linear-icon", () => ({
  LinearIcon: ({ className }: { className?: string }) => (
    <svg data-testid="linear-icon" className={className} />
  ),
}));

const REPORT_ID = "report-123";

describe("ExportToTracker", () => {
  beforeEach(() => {
    mockHookReturn = {
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    };
  });

  it("renders GitHub and Linear export buttons", () => {
    renderWithIntl(<ExportToTracker reportId={REPORT_ID} />);

    expect(screen.getByText("Export to GitHub")).toBeInTheDocument();
    expect(screen.getByText("Export to Linear")).toBeInTheDocument();
  });

  it("calls mutate with github provider when GitHub button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ExportToTracker reportId={REPORT_ID} />);

    await user.click(screen.getByText("Export to GitHub"));

    expect(mockHookReturn.mutate).toHaveBeenCalledWith(
      { reportId: REPORT_ID, provider: "github" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it("calls mutate with linear provider when Linear button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ExportToTracker reportId={REPORT_ID} />);

    await user.click(screen.getByText("Export to Linear"));

    expect(mockHookReturn.mutate).toHaveBeenCalledWith(
      { reportId: REPORT_ID, provider: "linear" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it("shows loading text when isPending and activeProvider is github", async () => {
    const user = userEvent.setup();
    // mutate is called inside the click handler after setActiveProvider("github").
    // Mutating the mock return makes the next render read isPending=true.
    mockHookReturn.mutate.mockImplementation(() => {
      mockHookReturn.isPending = true;
    });

    renderWithIntl(<ExportToTracker reportId={REPORT_ID} />);

    await user.click(screen.getByText("Export to GitHub"));

    expect(screen.getByText("Exporting...")).toBeInTheDocument();
  });

  it("shows success link with target=_blank and rel=noopener noreferrer for GitHub", async () => {
    const user = userEvent.setup();
    mockHookReturn.mutate.mockImplementation(
      (
        _args: unknown,
        options?: {
          onSuccess?: (data: {
            issueUrl: string;
            issueNumber: number;
            issueIdentifier: string | null;
          }) => void;
        },
      ) => {
        options?.onSuccess?.({
          issueUrl: "https://github.com/test/repo/issues/1",
          issueNumber: 1,
          issueIdentifier: null,
        });
      },
    );

    renderWithIntl(<ExportToTracker reportId={REPORT_ID} />);
    await user.click(screen.getByText("Export to GitHub"));

    const link = screen.getByRole("link", { name: /View on GitHub/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/test/repo/issues/1",
    );
  });

  it("shows issue identifier for Linear success", async () => {
    const user = userEvent.setup();
    mockHookReturn.mutate.mockImplementation(
      (
        _args: unknown,
        options?: {
          onSuccess?: (data: {
            issueUrl: string;
            issueNumber: number;
            issueIdentifier: string | null;
          }) => void;
        },
      ) => {
        options?.onSuccess?.({
          issueUrl: "https://linear.app/team/ENG-123",
          issueNumber: 123,
          issueIdentifier: "ENG-123",
        });
      },
    );

    renderWithIntl(<ExportToTracker reportId={REPORT_ID} />);
    await user.click(screen.getByText("Export to Linear"));

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("ENG-123");
    expect(link).toHaveTextContent("View on Linear");
  });

  it("shows error state with retry buttons when isError is true", () => {
    mockHookReturn.isError = true;
    mockHookReturn.error = new Error("Export failed");

    renderWithIntl(<ExportToTracker reportId={REPORT_ID} />);

    expect(
      screen.getByText("Export failed. Check integration settings."),
    ).toBeInTheDocument();
    expect(screen.getByText("Retry (GitHub)")).toBeInTheDocument();
    expect(screen.getByText("Retry (Linear)")).toBeInTheDocument();
  });
});
