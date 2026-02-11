import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithIntl } from "../test-utils";
import { ApiKeyDisplay } from "@/components/projects/api-key-display";

const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
});

const TEST_API_KEY = "bsk_pub_abc12345_suffix1234";
const MASKED_KEY = "bsk_pub_" + "..." + "1234";

describe("ApiKeyDisplay", () => {
  const mockOnRotate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  function renderComponent(props: { isRotating?: boolean } = {}) {
    return renderWithIntl(
      <ApiKeyDisplay
        apiKey={TEST_API_KEY}
        onRotate={mockOnRotate}
        isRotating={props.isRotating}
      />,
    );
  }

  describe("key display", () => {
    it("renders masked key showing first 8 chars and last 4 chars", () => {
      renderComponent();

      expect(screen.getByText(MASKED_KEY)).toBeInTheDocument();
    });

    it("reveals full key when eye button is clicked", () => {
      renderComponent();

      const revealButton = screen.getByTitle("Reveal");
      fireEvent.click(revealButton);

      expect(screen.getByText(TEST_API_KEY)).toBeInTheDocument();
    });

    it("hides key again when eye button is clicked twice", () => {
      renderComponent();

      // Reveal
      const revealButton = screen.getByTitle("Reveal");
      fireEvent.click(revealButton);
      expect(screen.getByText(TEST_API_KEY)).toBeInTheDocument();

      // Hide
      const hideButton = screen.getByTitle("Hide");
      fireEvent.click(hideButton);
      expect(screen.getByText(MASKED_KEY)).toBeInTheDocument();
    });
  });

  describe("copy functionality", () => {
    it("calls navigator.clipboard.writeText with full key", async () => {
      renderComponent();

      const copyButton = screen.getByTitle("Copy to clipboard");
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(mockWriteText).toHaveBeenCalledWith(TEST_API_KEY);
    });

    it("shows check icon after copy and reverts after 2 seconds", async () => {
      renderComponent();

      const copyButton = screen.getByTitle("Copy to clipboard");
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // After copy, the Check icon should appear (it has a green-500 class)
      const checkIcon = copyButton.querySelector(".text-green-500");
      expect(checkIcon).toBeInTheDocument();

      // After 2 seconds, it should revert
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      const greenIcon = copyButton.querySelector(".text-green-500");
      expect(greenIcon).not.toBeInTheDocument();
    });
  });

  describe("rotate functionality", () => {
    it("opens confirm dialog when rotate button is clicked", () => {
      renderComponent();

      const rotateButton = screen.getByTitle("Rotate key");
      fireEvent.click(rotateButton);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("calls onRotate when confirm is clicked", () => {
      renderComponent();

      // Open the dialog
      const rotateButton = screen.getByTitle("Rotate key");
      fireEvent.click(rotateButton);

      // The confirm dialog should show with the "Rotate Key" label
      const confirmButton = screen.getByText("Rotate Key");
      fireEvent.click(confirmButton);

      expect(mockOnRotate).toHaveBeenCalledTimes(1);
    });

    it("closes dialog without calling onRotate when cancel is clicked", () => {
      renderComponent();

      // Open the dialog
      const rotateButton = screen.getByTitle("Rotate key");
      fireEvent.click(rotateButton);

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockOnRotate).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("disables rotate button when isRotating is true", () => {
      renderComponent({ isRotating: true });

      const rotateButton = screen.getByTitle("Rotate key");
      expect(rotateButton).toBeDisabled();
    });

    it("enables rotate button when isRotating is false", () => {
      renderComponent({ isRotating: false });

      const rotateButton = screen.getByTitle("Rotate key");
      expect(rotateButton).not.toBeDisabled();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
