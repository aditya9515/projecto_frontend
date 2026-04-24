import { describeProviderConflict, getReadableProviderName } from "@/lib/provider-conflict";

describe("provider conflict helpers", () => {
  it("returns readable provider labels", () => {
    expect(getReadableProviderName("google.com")).toBe("Google");
    expect(getReadableProviderName("apple.com")).toBe("Apple");
  });

  it("describes provider conflicts clearly", () => {
    expect(describeProviderConflict(["google.com"])).toContain("Google");
    expect(describeProviderConflict(["apple.com", "google.com"])).toContain(
      "Apple, Google",
    );
  });
});
