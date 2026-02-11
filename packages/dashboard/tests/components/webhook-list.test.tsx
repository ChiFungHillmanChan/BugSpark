import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/react";
import { renderWithIntl } from "../test-utils";
import { WebhookList } from "@/app/(dashboard)/settings/components/webhook-list";
import type { Webhook } from "@/types";

const mockDeleteMutate = vi.fn();
const mockUpdateMutate = vi.fn();

vi.mock("@/hooks/use-webhooks", () => ({
  useDeleteWebhook: () => ({ mutate: mockDeleteMutate }),
  useUpdateWebhook: () => ({ mutate: mockUpdateMutate }),
}));

const mockWebhooks: Webhook[] = [
  {
    id: "wh-1",
    projectId: "proj-1",
    url: "https://example.com/webhook",
    events: ["report.created", "report.updated"],
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "wh-2",
    projectId: "proj-1",
    url: "https://other.com/hook",
    events: ["report.created"],
    isActive: false,
    createdAt: "2026-01-02T00:00:00Z",
  },
];

describe("WebhookList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders webhook URLs", () => {
    renderWithIntl(
      <WebhookList webhooks={mockWebhooks} projectId="proj-1" />,
    );

    expect(screen.getByText("https://example.com/webhook")).toBeInTheDocument();
    expect(screen.getByText("https://other.com/hook")).toBeInTheDocument();
  });

  it("renders event badges", () => {
    renderWithIntl(
      <WebhookList webhooks={mockWebhooks} projectId="proj-1" />,
    );

    expect(screen.getAllByText("Report created").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Report updated").length).toBeGreaterThanOrEqual(1);
  });

  it("shows active/inactive status", () => {
    renderWithIntl(
      <WebhookList webhooks={mockWebhooks} projectId="proj-1" />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("calls toggle when toggle button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <WebhookList webhooks={mockWebhooks} projectId="proj-1" />,
    );

    const toggleButtons = screen.getAllByTitle("Deactivate");
    await user.click(toggleButtons[0]);

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      webhookId: "wh-1",
      projectId: "proj-1",
      data: { isActive: false },
    });
  });

  it("opens confirm dialog on delete click", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <WebhookList webhooks={mockWebhooks} projectId="proj-1" />,
    );

    const deleteButtons = screen.getAllByTitle("Remove");
    await user.click(deleteButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to remove this webhook? This action cannot be undone.",
      ),
    ).toBeInTheDocument();
  });

  it("calls delete mutation on confirm", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <WebhookList webhooks={mockWebhooks} projectId="proj-1" />,
    );

    const deleteButtons = screen.getAllByTitle("Remove");
    await user.click(deleteButtons[0]);

    const dialog = screen.getByRole("dialog");
    const confirmButton = within(dialog).getByText("Remove");
    await user.click(confirmButton);

    expect(mockDeleteMutate).toHaveBeenCalledWith({
      webhookId: "wh-1",
      projectId: "proj-1",
    });
  });

  it("cancels delete dialog without calling mutation", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <WebhookList webhooks={mockWebhooks} projectId="proj-1" />,
    );

    const deleteButtons = screen.getAllByTitle("Remove");
    await user.click(deleteButtons[0]);

    const dialog = screen.getByRole("dialog");
    const cancelButton = within(dialog).getByText("Cancel");
    await user.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });
});
