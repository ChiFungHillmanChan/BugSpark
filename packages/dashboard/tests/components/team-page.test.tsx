import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../test-utils";
import TeamSettingsPage from "@/app/(dashboard)/settings/team/page";

const mockProjects = [
  {
    id: "proj-1",
    name: "Test Project",
    domain: "test.com",
    apiKey: "key",
    isActive: true,
    createdAt: "2024-01-01",
    settings: {},
  },
];

const mockMembers = [
  {
    id: "mem-1",
    projectId: "proj-1",
    userId: "u1",
    email: "alice@test.com",
    role: "editor" as const,
    inviteAcceptedAt: "2024-01-01",
    createdAt: "2024-01-01",
    displayName: "Alice",
  },
  {
    id: "mem-2",
    projectId: "proj-1",
    userId: null,
    email: "bob@test.com",
    role: "viewer" as const,
    inviteAcceptedAt: null,
    createdAt: "2024-01-01",
    displayName: null,
  },
];

const mockInviteMutate = vi.fn();
const mockRemoveMutate = vi.fn();
const mockUpdateRoleMutate = vi.fn();

vi.mock("@/hooks/use-projects", () => ({
  useManageableProjects: () => ({ data: mockProjects, isLoading: false }),
}));

vi.mock("@/hooks/use-team", () => ({
  useTeamMembers: (projectId: string) => ({
    data: projectId ? mockMembers : undefined,
    isLoading: false,
  }),
  useInviteMember: () => ({ mutate: mockInviteMutate, isPending: false }),
  useRemoveMember: () => ({ mutate: mockRemoveMutate, isPending: false }),
  useUpdateMemberRole: () => ({
    mutate: mockUpdateRoleMutate,
    isPending: false,
  }),
}));

function selectProject() {
  const select = screen.getAllByRole("combobox")[0];
  fireEvent.change(select, { target: { value: "proj-1" } });
}

describe("TeamSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders project selector with project names", () => {
    renderWithIntl(<TeamSettingsPage />);
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it('shows "select a project" prompt when no project selected', () => {
    renderWithIntl(<TeamSettingsPage />);
    const promptTexts = screen.getAllByText(
      "Select a project to manage team members.",
    );
    expect(promptTexts.length).toBeGreaterThan(0);
  });

  it("shows member list when project is selected", () => {
    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });

  it('shows "Pending" badge for member with no inviteAcceptedAt', () => {
    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("invite button toggles form visibility", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    const inviteButton = screen.getByText("Invite Member");
    await user.click(inviteButton);

    expect(
      screen.getByPlaceholderText("colleague@example.com"),
    ).toBeInTheDocument();
    expect(screen.getByText("Send Invite")).toBeInTheDocument();

    // Click again to hide
    await user.click(inviteButton);
    expect(
      screen.queryByPlaceholderText("colleague@example.com"),
    ).not.toBeInTheDocument();
  });

  it("invite form submission calls invite mutation", async () => {
    const user = userEvent.setup();
    mockInviteMutate.mockImplementation(
      (_data: unknown, options?: { onSuccess?: () => void }) => {
        options?.onSuccess?.();
      },
    );

    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    await user.click(screen.getByText("Invite Member"));

    const emailInput = screen.getByPlaceholderText("colleague@example.com");
    await user.type(emailInput, "new@test.com");

    await user.click(screen.getByText("Send Invite"));

    expect(mockInviteMutate).toHaveBeenCalledWith(
      { email: "new@test.com", role: "viewer" },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it("role dropdown calls update role mutation when changed", () => {
    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    // Find the role selects in the member rows (not the project selector)
    const roleSelects = screen.getAllByRole("combobox");
    // First combobox is project selector, the rest are role dropdowns in rows
    const aliceRoleSelect = roleSelects[1];

    fireEvent.change(aliceRoleSelect, { target: { value: "admin" } });

    expect(mockUpdateRoleMutate).toHaveBeenCalledWith({
      memberId: "mem-1",
      role: "admin",
    });
  });

  it("remove button opens ConfirmDialog", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    // Find remove buttons by title
    const removeButtons = screen.getAllByTitle("Remove");
    await user.click(removeButtons[0]);

    // ConfirmDialog should appear with role="dialog"
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText("Remove this member from the project?"),
    ).toBeInTheDocument();
  });

  it("confirm removal calls remove mutation", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    const removeButtons = screen.getAllByTitle("Remove");
    await user.click(removeButtons[0]);

    const dialog = screen.getByRole("dialog");
    const confirmButton = within(dialog).getByText("Remove");
    await user.click(confirmButton);

    expect(mockRemoveMutate).toHaveBeenCalledWith("mem-1");
  });

  it("cancel removal closes dialog without calling mutation", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TeamSettingsPage />);
    selectProject();

    const removeButtons = screen.getAllByTitle("Remove");
    await user.click(removeButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    const cancelButton = within(dialog).getByText("Cancel");
    await user.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockRemoveMutate).not.toHaveBeenCalled();
  });
});
