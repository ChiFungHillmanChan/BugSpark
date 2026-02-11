import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import { NetworkWaterfall } from "@/components/bug-detail/network-waterfall";
import type { NetworkRequest } from "@/types";

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  formatDuration: (ms: number) => `${ms}ms`,
}));

const sampleRequests: NetworkRequest[] = [
  {
    method: "GET",
    url: "https://api.example.com/data",
    status: 200,
    duration: 150,
    requestHeaders: { "Content-Type": "application/json" },
    responseHeaders: { "Cache-Control": "no-cache" },
    timestamp: 1000,
  },
  {
    method: "POST",
    url: "https://api.example.com/submit",
    status: 404,
    duration: 300,
    requestHeaders: {},
    responseHeaders: {},
    timestamp: 2000,
  },
  {
    method: "DELETE",
    url: "https://api.example.com/item/1",
    status: 500,
    duration: 1200,
    timestamp: 3000,
  },
];

describe("NetworkWaterfall", () => {
  it("shows empty state when requests is null", () => {
    renderWithIntl(<NetworkWaterfall requests={null} />);

    expect(
      screen.getByText("No network requests captured"),
    ).toBeInTheDocument();
  });

  it("shows empty state when requests is empty array", () => {
    renderWithIntl(<NetworkWaterfall requests={[]} />);

    expect(
      screen.getByText("No network requests captured"),
    ).toBeInTheDocument();
  });

  it("renders request rows with method, URL, status code, and duration", () => {
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    expect(screen.getByText("GET")).toBeInTheDocument();
    expect(screen.getByText("https://api.example.com/data")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("150ms")).toBeInTheDocument();

    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("https://api.example.com/submit")).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("300ms")).toBeInTheDocument();

    expect(screen.getByText("DELETE")).toBeInTheDocument();
    expect(screen.getByText("https://api.example.com/item/1")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("1200ms")).toBeInTheDocument();
  });

  it("applies correct CSS classes for GET method badge", () => {
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const getBadge = screen.getByText("GET");
    expect(getBadge.className).toContain("bg-green-100");
    expect(getBadge.className).toContain("text-green-700");
  });

  it("applies correct CSS classes for POST method badge", () => {
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const postBadge = screen.getByText("POST");
    expect(postBadge.className).toContain("bg-blue-100");
    expect(postBadge.className).toContain("text-blue-700");
  });

  it("applies correct CSS classes for DELETE method badge", () => {
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const deleteBadge = screen.getByText("DELETE");
    expect(deleteBadge.className).toContain("bg-red-100");
    expect(deleteBadge.className).toContain("text-red-700");
  });

  it("applies correct CSS classes for PUT method badge", () => {
    const putRequest: NetworkRequest[] = [
      {
        method: "PUT",
        url: "https://api.example.com/update",
        status: 200,
        duration: 100,
        timestamp: 1000,
      },
    ];
    renderWithIntl(<NetworkWaterfall requests={putRequest} />);

    const putBadge = screen.getByText("PUT");
    expect(putBadge.className).toContain("bg-yellow-100");
    expect(putBadge.className).toContain("text-yellow-700");
  });

  it("applies correct CSS classes for PATCH method badge", () => {
    const patchRequest: NetworkRequest[] = [
      {
        method: "PATCH",
        url: "https://api.example.com/patch",
        status: 200,
        duration: 100,
        timestamp: 1000,
      },
    ];
    renderWithIntl(<NetworkWaterfall requests={patchRequest} />);

    const patchBadge = screen.getByText("PATCH");
    expect(patchBadge.className).toContain("bg-orange-100");
    expect(patchBadge.className).toContain("text-orange-700");
  });

  it("applies green color for 200 status code", () => {
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const statusEl = screen.getByText("200");
    expect(statusEl.className).toContain("text-green-600");
  });

  it("applies yellow color for 404 status code", () => {
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const statusEl = screen.getByText("404");
    expect(statusEl.className).toContain("text-yellow-600");
  });

  it("applies red color for 500 status code", () => {
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const statusEl = screen.getByText("500");
    expect(statusEl.className).toContain("text-red-600");
  });

  it("expands request detail on click", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    expect(screen.queryByText("Content-Type:")).not.toBeInTheDocument();

    const firstRow = screen.getByText("https://api.example.com/data").closest("button");
    await user.click(firstRow!);

    expect(screen.getByText("Content-Type:")).toBeInTheDocument();
    expect(screen.getByText("application/json")).toBeInTheDocument();
    expect(screen.getByText("Cache-Control:")).toBeInTheDocument();
    expect(screen.getByText("no-cache")).toBeInTheDocument();
  });

  it("collapses expanded request on second click", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const firstRow = screen.getByText("https://api.example.com/data").closest("button");
    await user.click(firstRow!);

    expect(screen.getByText("Content-Type:")).toBeInTheDocument();

    await user.click(firstRow!);

    expect(screen.queryByText("Content-Type:")).not.toBeInTheDocument();
  });

  it("shows request and response headers in expanded view", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const firstRow = screen.getByText("https://api.example.com/data").closest("button");
    await user.click(firstRow!);

    expect(screen.getByText("Request Headers")).toBeInTheDocument();
    expect(screen.getByText("Response Headers")).toBeInTheDocument();
    expect(screen.getByText("Content-Type:")).toBeInTheDocument();
    expect(screen.getByText("application/json")).toBeInTheDocument();
    expect(screen.getByText("Cache-Control:")).toBeInTheDocument();
    expect(screen.getByText("no-cache")).toBeInTheDocument();
  });

  it("shows 'No headers' text when headers are empty", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const secondRow = screen.getByText("https://api.example.com/submit").closest("button");
    await user.click(secondRow!);

    const noHeadersTexts = screen.getAllByText("No headers");
    expect(noHeadersTexts).toHaveLength(2);
  });

  it("shows 'No headers' text when headers are undefined", async () => {
    const user = userEvent.setup();
    renderWithIntl(<NetworkWaterfall requests={sampleRequests} />);

    const thirdRow = screen.getByText("https://api.example.com/item/1").closest("button");
    await user.click(thirdRow!);

    const noHeadersTexts = screen.getAllByText("No headers");
    expect(noHeadersTexts).toHaveLength(2);
  });
});
