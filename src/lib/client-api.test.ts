import type { User } from "firebase/auth";
import { authorizedFetch, readApiResponse } from "@/lib/client-api";

describe("authenticated API requests", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("refreshes an expired token once and preserves Headers values", async () => {
    const getIdToken = vi.fn().mockResolvedValueOnce("expired").mockResolvedValueOnce("fresh");
    const fetch = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 401 })).mockResolvedValueOnce(new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    await authorizedFetch({ getIdToken } as unknown as User, "/api/auth/sync", { method: "POST", headers: new Headers({ "Content-Type": "application/json" }), body: "{}" });
    expect(getIdToken.mock.calls).toEqual([[false], [true]]);
    const options = fetch.mock.calls[1][1];
    expect(options.headers.get("Authorization")).toBe("Bearer fresh");
    expect(options.headers.get("Content-Type")).toBe("application/json");
    expect(options.body).toBe("{}");
  });

  it("does not retry server errors or successful mutations", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", fetch);
    await authorizedFetch({ getIdToken: vi.fn().mockResolvedValue("token") } as unknown as User, "/api/projects", { method: "POST" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("presents a useful error when a proxy returns HTML", async () => {
    await expect(readApiResponse(new Response("<html>Unavailable</html>", { status: 502 }), "Unable to load account.")).rejects.toThrow("Unable to load account.");
  });
});
