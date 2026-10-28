import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Header } from "@/components/navigation/header";
import { Sidebar } from "@/components/navigation/sidebar";

const mockSignOut = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn().mockResolvedValue({
  data: {
    user: {
      id: "usr-123",
      email: "engineer@company.com",
      user_metadata: { full_name: "Lead Engineer" },
    },
  },
  error: null,
});
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

vi.mock("@/components/workspaces/workspace-switcher", () => ({
  WorkspaceSwitcher: () => <div data-testid="workspace-switcher" />,
}));

vi.mock("@/components/providers/workspace-provider", () => ({
  useWorkspace: () => ({
    workspaceId: "ws-1",
    workspaces: [],
    currentWorkspace: null,
    isLoading: false,
    setCurrentWorkspaceId: vi.fn(),
    refreshWorkspaces: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("Authentication Navigation & Sign-out Suite", () => {
  const originalLocation = window.location;
  let mockReplace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReplace = vi.fn();
    delete (window as unknown as Record<string, unknown>).location;
    (window as unknown as Record<string, unknown>).location = {
      ...originalLocation,
      replace: mockReplace,
      href: "http://localhost:3000/dashboard",
    };
  });

  afterEach(() => {
    (window as unknown as Record<string, unknown>).location = originalLocation;
  });

  it("Header renders user info and signs out with redirection to /", async () => {
    render(<Header />);

    // Wait for user to be loaded in header
    await waitFor(() => {
      expect(screen.getByText("Lead Engineer")).toBeDefined();
    });

    const signOutBtn = screen.getByRole("button", { name: /sign out/i });
    expect(signOutBtn).toBeDefined();

    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("Sidebar renders Sign Out button and executes sign out with redirection to /", async () => {
    render(<Sidebar isOpen={true} />);

    const sidebarSignOutBtn = screen.getByRole("button", { name: /sign out/i });
    expect(sidebarSignOutBtn).toBeDefined();

    fireEvent.click(sidebarSignOutBtn);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});
