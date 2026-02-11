import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithIntl } from "../test-utils";
import WebhooksPage from "@/app/(dashboard)/settings/webhooks/page";
import type { Webhook, Project } from "@/types";

const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Project Alpha",
    domain: "alpha.com",
    apiKey: "bsk_pub_xxx",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    settings: {},
  },
  {
    id: "proj-2",
    name: "Project Beta",
    domain: "beta.com",
    apiKey: "bsk_pub_yyy",
    isActive: true,
    createdAt: "2026-01-02T00:00:00Z",
    settings: {},
  },
];

const mockWebhooks: Webhook[] = [
  {
    id: "wh-1",
    projectId: "proj-1",
    url: "https://example.com/webhook",
    events: ["report.created"],
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

let returnedWebhooks: Webhook[] | undefined = mockWebhooks;
let isLoading = false;

vi.mock("@/hooks/use-projects", () => ({
  useProjects: () => ({ data: mockProjects }),
}));

vi.mock("@/hooks/use-webhooks", () => ({
  useWebhooks: () => ({
    data: returnedWebhooks,
    isLoading,
  }),
  useCreateWebhook: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateWebhook: () => ({ mutate: vi.fn() }),
  useDeleteWebhook: () => ({ mutate: vi.fn() }),
}));

describe("WebhooksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    returnedWebhooks = mockWebhooks;
    isLoading = false;
  });

  it("renders page title and description", () => {
    renderWithIntl(<WebhooksPage />);

    expect(screen.getByText("Webhooks")).toBeInTheDocument();
    expect(
      screen.getByText("Receive HTTP callbacks when events happen in your project."),
    ).toBeInTheDocument();
  });

  it("renders project selector when multiple projects exist", () => {
    renderWithIntl(<WebhooksPage />);

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
  });

  it("renders webhook list when webhooks exist", () => {
    renderWithIntl(<WebhooksPage />);

    expect(screen.getByText("https://example.com/webhook")).toBeInTheDocument();
  });

  it("renders empty state when no webhooks exist", () => {
    returnedWebhooks = [];
    renderWithIntl(<WebhooksPage />);

    expect(
      screen.getByText("No webhooks configured yet."),
    ).toBeInTheDocument();
  });

  it("renders loading state", () => {
    isLoading = true;
    returnedWebhooks = undefined;
    renderWithIntl(<WebhooksPage />);

    expect(screen.getByText("Loading webhooks...")).toBeInTheDocument();
  });

  it("shows add webhook button", () => {
    renderWithIntl(<WebhooksPage />);

    expect(screen.getByText("Add Webhook")).toBeInTheDocument();
  });

  it("switches project on dropdown change", () => {
    renderWithIntl(<WebhooksPage />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "proj-2" } });

    expect((select as HTMLSelectElement).value).toBe("proj-2");
  });
});
