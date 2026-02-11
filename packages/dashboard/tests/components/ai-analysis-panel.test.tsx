import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import { AiAnalysisPanel } from "@/components/bug-detail/ai-analysis-panel";
import type { AnalysisResponse } from "@/types";

let mockAnalysisReturn: {
  mutate: ReturnType<typeof vi.fn>;
  data: AnalysisResponse | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

vi.mock("@/hooks/use-analysis", () => ({
  useAnalyzeReport: () => mockAnalysisReturn,
}));

vi.mock("axios", () => ({
  isAxiosError: (err: unknown) =>
    err !== null &&
    typeof err === "object" &&
    "isAxiosError" in err,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

const REPORT_ID = "report-456";

const mockAnalysis: AnalysisResponse = {
  summary: "Test summary of the bug",
  suggestedCategory: "bug",
  suggestedSeverity: "high",
  reproductionSteps: ["Step 1: open page", "Step 2: click button"],
  rootCause: "A root cause description",
  fixSuggestions: ["Fix suggestion 1", "Fix suggestion 2"],
  affectedArea: "Authentication",
};

describe("AiAnalysisPanel", () => {
  beforeEach(() => {
    mockAnalysisReturn = {
      mutate: vi.fn(),
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
    };
  });

  it("shows Analyze button when no data and not pending", () => {
    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.getByText("Analyze with AI")).toBeInTheDocument();
  });

  it("calls mutate with reportId when button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    await user.click(screen.getByText("Analyze with AI"));

    expect(mockAnalysisReturn.mutate).toHaveBeenCalledWith(REPORT_ID);
  });

  it("shows loading spinner when isPending is true", () => {
    mockAnalysisReturn.isPending = true;

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.getByText("Analyzing bug report...")).toBeInTheDocument();
  });

  it("renders all analysis fields when data is present", () => {
    mockAnalysisReturn.data = mockAnalysis;

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.getByText("Test summary of the bug")).toBeInTheDocument();
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("Step 1: open page")).toBeInTheDocument();
    expect(screen.getByText("Step 2: click button")).toBeInTheDocument();
    expect(screen.getByText("A root cause description")).toBeInTheDocument();
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Fix suggestion 1")).toBeInTheDocument();
    expect(screen.getByText("Fix suggestion 2")).toBeInTheDocument();
  });

  it("renders section labels for analysis data", () => {
    mockAnalysisReturn.data = mockAnalysis;

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Severity")).toBeInTheDocument();
    expect(screen.getByText("Reproduction Steps")).toBeInTheDocument();
    expect(screen.getByText("Root Cause")).toBeInTheDocument();
    expect(screen.getByText("Affected Area")).toBeInTheDocument();
    expect(screen.getByText("Fix Suggestions")).toBeInTheDocument();
  });

  it("does not render rootCause section when rootCause is empty", () => {
    mockAnalysisReturn.data = { ...mockAnalysis, rootCause: "" };

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.queryByText("Root Cause")).not.toBeInTheDocument();
  });

  it("does not render affectedArea section when affectedArea is empty", () => {
    mockAnalysisReturn.data = { ...mockAnalysis, affectedArea: "" };

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.queryByText("Affected Area")).not.toBeInTheDocument();
  });

  it("does not render fixSuggestions section when fixSuggestions is empty", () => {
    mockAnalysisReturn.data = { ...mockAnalysis, fixSuggestions: [] };

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.queryByText("Fix Suggestions")).not.toBeInTheDocument();
  });

  it("does not render reproductionSteps section when reproductionSteps is empty", () => {
    mockAnalysisReturn.data = { ...mockAnalysis, reproductionSteps: [] };

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(screen.queryByText("Reproduction Steps")).not.toBeInTheDocument();
  });

  it("shows API key error message when error contains ANTHROPIC_API_KEY", () => {
    mockAnalysisReturn.isError = true;
    mockAnalysisReturn.error = new Error("ANTHROPIC_API_KEY is not configured");

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(
      screen.getByText(
        "AI analysis requires an Anthropic API key to be configured.",
      ),
    ).toBeInTheDocument();
  });

  it("shows API key error for axios error with ANTHROPIC_API_KEY in detail", () => {
    const axiosError = {
      isAxiosError: true,
      message: "Request failed",
      response: {
        data: { detail: "ANTHROPIC_API_KEY not set" },
      },
    };
    mockAnalysisReturn.isError = true;
    mockAnalysisReturn.error = axiosError as unknown as Error;

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(
      screen.getByText(
        "AI analysis requires an Anthropic API key to be configured.",
      ),
    ).toBeInTheDocument();
  });

  it("shows generic error message for non-API-key errors", () => {
    mockAnalysisReturn.isError = true;
    mockAnalysisReturn.error = new Error("Network timeout");

    renderWithIntl(<AiAnalysisPanel reportId={REPORT_ID} />);

    expect(
      screen.getByText("Analysis failed. Please try again."),
    ).toBeInTheDocument();
  });
});
