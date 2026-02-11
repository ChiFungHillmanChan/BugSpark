import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import { WebhookForm } from "@/app/(dashboard)/settings/components/webhook-form";

const mockCreateMutate = vi.fn();

vi.mock("@/hooks/use-webhooks", () => ({
  useCreateWebhook: () => ({ mutate: mockCreateMutate, isPending: false }),
}));

describe("WebhookForm", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders URL input and event checkboxes", () => {
    renderWithIntl(
      <WebhookForm projectId="proj-1" onClose={onClose} />,
    );

    expect(screen.getByPlaceholderText("https://example.com/webhook")).toBeInTheDocument();
    expect(screen.getByLabelText("Report created")).toBeInTheDocument();
    expect(screen.getByLabelText("Report updated")).toBeInTheDocument();
  });

  it("has all events checked by default", () => {
    renderWithIntl(
      <WebhookForm projectId="proj-1" onClose={onClose} />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <WebhookForm projectId="proj-1" onClose={onClose} />,
    );

    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("can uncheck an event", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <WebhookForm projectId="proj-1" onClose={onClose} />,
    );

    const reportCreated = screen.getByLabelText("Report created");
    await user.click(reportCreated);
    expect(reportCreated).not.toBeChecked();
  });

  it("shows validation error when all events are unchecked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <WebhookForm projectId="proj-1" onClose={onClose} />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    for (const checkbox of checkboxes) {
      await user.click(checkbox);
    }

    expect(screen.getByText("Select at least one event.")).toBeInTheDocument();
  });

  it("calls create mutation on valid submit", async () => {
    const user = userEvent.setup();
    mockCreateMutate.mockImplementation(
      (_data: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    renderWithIntl(
      <WebhookForm projectId="proj-1" onClose={onClose} />,
    );

    const urlInput = screen.getByPlaceholderText("https://example.com/webhook");
    await user.type(urlInput, "https://hooks.example.com/test");

    await user.click(screen.getByText("Create"));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      {
        projectId: "proj-1",
        data: {
          url: "https://hooks.example.com/test",
          events: ["report.created", "report.updated"],
        },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  });
});
