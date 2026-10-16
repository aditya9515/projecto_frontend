import { NextRequest } from "next/server";
import { POST } from "./route";
vi.mock("@/lib/env", () => ({ getAppRuntimeEnv: () => ({ APP_BASE_URL: "https://projecto.test" }), parseAllowedOrigins: () => [] }));

describe("desktop validation responses", () => {
  it("returns malformed JSON as a readable 400 for an allowed origin", async () => {
    const response = await POST(new NextRequest("https://projecto.test/api/desktop/projects/list", { method: "POST", headers: { Origin: "https://projecto.test" }, body: "{" }));
    expect(response.status).toBe(400);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://projecto.test");
    expect(await response.json()).toEqual({ error: "Request body must contain valid JSON." });
  });
  it("rejects disallowed origins without reflecting them", async () => {
    const response = await POST(new NextRequest("https://projecto.test/api/desktop/projects/list", { method: "POST", headers: { Origin: "https://example.com" }, body: "{}" }));
    expect(response.status).toBe(403);
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
  });
});
