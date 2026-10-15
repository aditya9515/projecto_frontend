import { GET } from "./route";

const release = (version: string, assets = [{
  id: 1234,
  name: `Projecto-${version}.Setup.exe`, state: "uploaded", size: 138862080,
  browser_download_url: `https://github.com/aditya9515/Projecto/releases/download/v${version}/Projecto-${version}.Setup.exe`,
}]) => ({ tag_name: `v${version}`, draft: false, prerelease: false, assets });

describe("latest installer download", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["1.0.8", "1.0.9"])("redirects directly to version %s's installer", async (version) => {
    const location = `https://release-assets.githubusercontent.com/installer-${version}.exe`;
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(release(version))))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: location } }));
    vi.stubGlobal("fetch", fetch);
    const response = await GET();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(location);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetch).toHaveBeenLastCalledWith("https://api.github.com/repos/aditya9515/Projecto/releases/assets/1234", expect.objectContaining({ redirect: "manual", cache: "no-store" }));
  });

  it("serves an attachment if GitHub returns the installer bytes directly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(release("1.0.8"))))
      .mockResolvedValueOnce(new Response("installer", { headers: { "Content-Type": "application/octet-stream" } })));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("Projecto-1.0.8.Setup.exe");
    expect(await response.text()).toBe("installer");
  });

  it("does not send users to an old build when the latest installer is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(release("1.0.9", [])))));
    expect((await GET()).status).toBe(503);
  });

  it("reports upstream failures without redirecting to the releases page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 403 })));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.has("Location")).toBe(false);
  });
});
