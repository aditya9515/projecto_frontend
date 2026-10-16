import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthFlowCard } from "./auth-flow-card";

const mocks = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  auth: {},
  router: { replace: vi.fn() },
  sync: vi.fn(), popup: vi.fn(), redirect: vi.fn(), redirectResult: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks.router, useSearchParams: () => new URLSearchParams() }));
vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => ({ user: mocks.user, loading: false, ready: true, error: null }) }));
vi.mock("@/lib/firebase/client", () => ({ getFirebaseAuthClient: async () => mocks.auth }));
vi.mock("@/lib/firebase/sync", () => ({ syncFirebaseUser: mocks.sync }));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class { setCustomParameters() {} },
  OAuthProvider: class { addScope() {} },
  signInWithPopup: mocks.popup, signInWithRedirect: mocks.redirect,
  getRedirectResult: mocks.redirectResult, fetchSignInMethodsForEmail: vi.fn(),
}));

describe("sign-in completion", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.user = null;
    mocks.redirectResult.mockResolvedValue(null);
    mocks.sync.mockResolvedValue({});
  });

  it("surfaces redirect fallback failures and enables a new attempt", async () => {
    mocks.popup.mockRejectedValue({ code: "auth/popup-blocked" });
    mocks.redirect.mockRejectedValue({ code: "auth/network-request-failed" });
    render(<AuthFlowCard mode="login" />);
    await userEvent.click(screen.getByRole("button", { name: /Continue with Google/i }));
    expect(await screen.findByText("Sign-in could not connect. Check your connection and try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeEnabled();
  });

  it("shows a failed account sync and resumes successfully on an explicit retry", async () => {
    mocks.user = { uid: "user_1" };
    mocks.sync.mockRejectedValue(new Error("Unable to sync your account"));
    render(<AuthFlowCard mode="login" />);
    const retry = await screen.findByRole("button", { name: "Retry account connection" });
    expect(mocks.sync).toHaveBeenCalledTimes(1);
    expect(mocks.router.replace).not.toHaveBeenCalled();
    mocks.sync.mockResolvedValue({});
    await userEvent.click(retry);
    await waitFor(() => expect(mocks.router.replace).toHaveBeenCalledWith("/account"));
  });

  it("finalizes a redirect result once when Firebase also reports the signed-in user", async () => {
    mocks.user = { uid: "user_1" };
    mocks.redirectResult.mockResolvedValue({ user: mocks.user });
    render(<AuthFlowCard mode="login" />);
    await waitFor(() => expect(mocks.router.replace).toHaveBeenCalledWith("/account"));
    expect(mocks.sync).toHaveBeenCalledTimes(1);
  });
});
