import { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-server";
const mocks = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("@/lib/firebase/admin", () => ({ getAdminAuth: () => mocks }));

describe("server authentication", () => {
  it.each(["auth/argument-error", "auth/id-token-expired", "auth/id-token-revoked"])("reports %s as unauthorized", async (code) => {
    mocks.verifyIdToken.mockRejectedValueOnce(Object.assign(new Error("internal Firebase error"), { code }));
    await expect(requireVerifiedUser(new NextRequest("https://projecto.test", { headers: { Authorization: "Bearer bad" } }))).rejects.toThrow("Unauthorized");
  });
  it("preserves infrastructure errors so they do not appear as invalid credentials", async () => {
    mocks.verifyIdToken.mockRejectedValueOnce(Object.assign(new Error("database unavailable"), { code: "auth/internal-error" }));
    await expect(requireVerifiedUser(new NextRequest("https://projecto.test", { headers: { Authorization: "Bearer token" } }))).rejects.toThrow("database unavailable");
  });
});
