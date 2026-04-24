import { buildDesktopCorsHeaders, resolveDesktopAllowedOrigin } from "@/lib/cors";

describe("desktop cors helpers", () => {
  it("allows same-origin app requests", () => {
    expect(
      resolveDesktopAllowedOrigin(
        "https://projecto.app",
        "https://projecto.app",
      ),
    ).toBe("https://projecto.app");
  });

  it("allows explicitly configured desktop origins", () => {
    expect(
      resolveDesktopAllowedOrigin(
        "https://desktop.projecto.app",
        "https://projecto.app",
        "https://desktop.projecto.app, https://staging.projecto.app",
      ),
    ).toBe("https://desktop.projecto.app");
  });

  it("rejects unconfigured cross-origin requests", () => {
    expect(
      resolveDesktopAllowedOrigin(
        "https://malicious.example",
        "https://projecto.app",
      ),
    ).toBeNull();
  });

  it("builds desktop cors headers", () => {
    const headers = buildDesktopCorsHeaders("https://projecto.app");
    expect(headers.get("Access-Control-Allow-Origin")).toBe(
      "https://projecto.app",
    );
    expect(headers.get("Access-Control-Allow-Methods")).toContain("OPTIONS");
  });
});
