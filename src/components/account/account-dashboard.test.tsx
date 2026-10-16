import { render, screen, waitFor } from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import { AccountDashboard } from "@/components/account/account-dashboard";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signOut: vi.fn(),
  authorizedFetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mocks.replace,
  }),
}));

const accountUser = {
      uid: "user_1",
      displayName: "Ada Lovelace",
      email: "ada@projecto.dev",
      emailVerified: true,
      providerData: [{ providerId: "google.com" }],
};
vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: accountUser,
    loading: false,
    ready: true,
    signOut: mocks.signOut,
  }),
}));

vi.mock("@/components/desktop/continue-in-desktop-button", () => ({
  ContinueInDesktopButton: () => <div>Continue in Desktop App</div>,
}));

vi.mock("@/lib/client-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/client-api")>(),
  authorizedFetch: mocks.authorizedFetch,
}));

describe("AccountDashboard", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.signOut.mockReset();
    mocks.authorizedFetch.mockReset();
    window.localStorage.clear();

    mocks.authorizedFetch.mockImplementation(async (_user, url) => ({
      ok: true,
      json: async () => url === "/api/projects" ? { projects: [], archivedProjects: [] } : url === "/api/account/desktop-sessions" ? { sessions: [] } : ({
        canManageBilling: true,
        plan: "pro",
        status: "active",
        expiresAt: "2026-12-01T00:00:00.000Z",
      }),
    }));
  });

  it("renders the account rail and desktop session panel", async () => {
    render(<AccountDashboard />);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@projecto.dev")).toBeInTheDocument();
    expect(screen.getByText("Providers")).toBeInTheDocument();
    expect(screen.getByText("Current plan")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Desktop devices")).toBeInTheDocument();
      expect(mocks.authorizedFetch).toHaveBeenCalledWith(
        expect.anything(),
        "/api/account/desktop-sessions",
      );
    });
  });

  it("shows retrieval failures without claiming Free access or an empty device list", async () => {
    mocks.authorizedFetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "Account service unavailable" }) });
    render(<AccountDashboard />);
    expect(await screen.findByRole("button", { name: "Retry account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry devices" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry projects" })).toBeInTheDocument();
    expect(screen.queryByText("No desktop sessions have been created yet.")).not.toBeInTheDocument();
    expect(screen.queryByText("Verified for Free desktop access")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage billing" })).toBeDisabled();
  });

  it("retrieves and presents saved directory metadata after a retry", async () => {
    mocks.authorizedFetch.mockRejectedValue(new Error("Connection failed"));
    render(<AccountDashboard />);
    const retry = await screen.findByRole("button", { name: "Retry projects" });
    mocks.authorizedFetch.mockResolvedValue({ ok: true, json: async () => ({ projects: [{ id: "project_1", name: "My app", directoryPath: "D:/work/app", archivedByPlan: false }], archivedProjects: [] }) });
    await userEvent.click(retry);
    expect(await screen.findByText("My app")).toBeInTheDocument();
    expect(screen.getByText("D:/work/app")).toBeInTheDocument();
  });
});
