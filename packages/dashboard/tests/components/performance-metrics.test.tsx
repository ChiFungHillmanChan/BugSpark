import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../test-utils";
import { PerformanceMetricsPanel } from "@/components/bug-detail/performance-metrics";
import type { PerformanceMetrics } from "@/types";

const fullMetrics: PerformanceMetrics = {
  lcp: 1500,
  fid: 80,
  cls: 0.05,
  ttfb: 600,
  inp: 150,
};



describe("PerformanceMetricsPanel", () => {
  it("shows empty state when performance is undefined", () => {
    renderWithIntl(<PerformanceMetricsPanel performance={undefined} />);
    expect(screen.getByText("No performance data")).toBeInTheDocument();
  });

  it("shows empty state when performance object has no metrics", () => {
    renderWithIntl(<PerformanceMetricsPanel performance={{}} />);
    expect(screen.getByText("No performance data")).toBeInTheDocument();
  });

  it('shows LCP with "good" rating for value 1500', () => {
    renderWithIntl(
      <PerformanceMetricsPanel performance={{ lcp: 1500 }} />,
    );
    expect(screen.getByText("LCP")).toBeInTheDocument();
    // 1500 >= 1000 so formatted as seconds
    expect(screen.getByText("1.50s")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it('shows LCP with "needs-improvement" for value 3000', () => {
    renderWithIntl(
      <PerformanceMetricsPanel performance={{ lcp: 3000 }} />,
    );
    expect(screen.getByText("LCP")).toBeInTheDocument();
    expect(screen.getByText("3.00s")).toBeInTheDocument();
    expect(screen.getByText("Needs Improvement")).toBeInTheDocument();
  });

  it('shows LCP with "poor" for value 5000', () => {
    renderWithIntl(
      <PerformanceMetricsPanel performance={{ lcp: 5000 }} />,
    );
    expect(screen.getByText("LCP")).toBeInTheDocument();
    expect(screen.getByText("5.00s")).toBeInTheDocument();
    expect(screen.getByText("Poor")).toBeInTheDocument();
  });

  it("formats values >= 1000ms as seconds", () => {
    renderWithIntl(
      <PerformanceMetricsPanel performance={{ lcp: 2500 }} />,
    );
    expect(screen.getByText("2.50s")).toBeInTheDocument();
  });

  it('CLS renders without "ms" suffix', () => {
    renderWithIntl(
      <PerformanceMetricsPanel performance={{ cls: 0.05 }} />,
    );
    expect(screen.getByText("CLS")).toBeInTheDocument();
    expect(screen.getByText("0.050")).toBeInTheDocument();
    expect(screen.queryByText(/ms/)).not.toBeInTheDocument();
  });

  it("renders all 5 metrics when all provided", () => {
    renderWithIntl(
      <PerformanceMetricsPanel performance={fullMetrics} />,
    );
    expect(screen.getByText("LCP")).toBeInTheDocument();
    expect(screen.getByText("FID")).toBeInTheDocument();
    expect(screen.getByText("CLS")).toBeInTheDocument();
    expect(screen.getByText("TTFB")).toBeInTheDocument();
    expect(screen.getByText("INP")).toBeInTheDocument();

    // Verify formatted values (1500 >= 1000 => "1.50s")
    expect(screen.getByText("1.50s")).toBeInTheDocument();
    expect(screen.getByText("80ms")).toBeInTheDocument();
    expect(screen.getByText("0.050")).toBeInTheDocument();
    expect(screen.getByText("600ms")).toBeInTheDocument();
    expect(screen.getByText("150ms")).toBeInTheDocument();
  });

  it("only renders available metrics and skips undefined ones", () => {
    renderWithIntl(
      <PerformanceMetricsPanel performance={{ lcp: 1500, cls: 0.1 }} />,
    );
    expect(screen.getByText("LCP")).toBeInTheDocument();
    expect(screen.getByText("CLS")).toBeInTheDocument();
    expect(screen.queryByText("FID")).not.toBeInTheDocument();
    expect(screen.queryByText("TTFB")).not.toBeInTheDocument();
    expect(screen.queryByText("INP")).not.toBeInTheDocument();
  });
});
