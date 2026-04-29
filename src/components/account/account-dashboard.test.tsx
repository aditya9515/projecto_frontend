import { render, screen, waitFor } from "@testing-library/react";

import { AccountDashboard } from "@/components/account/account-dashboard";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

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

vi.mock("@/components/auth/auth-provider", () => ({
  useAuth: () => ({
    user: {
      displayName: "Ada Lovelace",
      email: "ada@projecto.dev",
      emailVerified: true,
      providerData: [{ providerId: "google.com" }],
    },
    loading: false,
    ready: true,
    signOut: mocks.signOut,
  }),
}));

vi.mock("@/components/desktop/continue-in-desktop-button", () => ({
  ContinueInDesktopButton: () => <div>Continue in Desktop App</div>,
}));

vi.mock("@/lib/client-api", () => ({
  authorizedFetch: mocks.authorizedFetch,
}));

describe("AccountDashboard", () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.signOut.mockReset();
    mocks.authorizedFetch.mockReset();
    window.localStorage.clear();

    mocks.authorizedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        plan: "pro",
        status: "active",
        expiresAt: "2026-12-01T00:00:00.000Z",
      }),
    });
  });

  it("renders the account rail and reflects the saved theme choice", async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    render(
      <ThemeProvider>
        <AccountDashboard />
      </ThemeProvider>,
    );

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@projecto.dev")).toBeInTheDocument();
    expect(screen.getByText("Providers")).toBeInTheDocument();
    expect(screen.getByText("Current plan")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();

    const lightButton = screen.getByRole("button", { name: /Light/i });
    const darkButton = screen.getByRole("button", { name: /Dark/i });

    await waitFor(() => {
      expect(lightButton).toHaveAttribute("aria-pressed", "true");
      expect(darkButton).toHaveAttribute("aria-pressed", "false");
      expect(document.documentElement.dataset.theme).toBe("light");
    });
  });
});
