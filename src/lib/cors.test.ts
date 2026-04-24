import { buildDesktopCorsHeaders, resolveDesktopAllowedOrigin } from "@/lib/cors";

describe("desktop cors helpers", () => {
  it("allows same-origin app requests", () => {
    expect(
      resolveDesktopAllowedOrigin(
        "https://launchstack.app",
        "https://launchstack.app",
      ),
    ).toBe("https://launchstack.app");
  });

  it("allows explicitly configured desktop origins", () => {
    expect(
      resolveDesktopAllowedOrigin(
        "https://desktop.launchstack.app",
        "https://launchstack.app",
        "https://desktop.launchstack.app, https://staging.launchstack.app",
      ),
    ).toBe("https://desktop.launchstack.app");
  });

  it("rejects unconfigured cross-origin requests", () => {
    expect(
      resolveDesktopAllowedOrigin(
        "https://malicious.example",
        "https://launchstack.app",
      ),
    ).toBeNull();
  });

  it("builds desktop cors headers", () => {
    const headers = buildDesktopCorsHeaders("https://launchstack.app");
    expect(headers.get("Access-Control-Allow-Origin")).toBe(
      "https://launchstack.app",
    );
    expect(headers.get("Access-Control-Allow-Methods")).toContain("OPTIONS");
  });
});
