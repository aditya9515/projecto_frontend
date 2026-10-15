import { buildCheckoutLoginHref, buildPostLoginDestination, parseBillingCycle } from "@/lib/auth-routing";

describe("auth routing helpers", () => {
  it("parses billing cycle safely", () => {
    expect(parseBillingCycle("yearly")).toBe("yearly");
    expect(parseBillingCycle("monthly")).toBe("monthly");
    expect(parseBillingCycle("unknown")).toBe("monthly");
    expect(parseBillingCycle(null)).toBe("monthly");
  });

  it.each(["https://example.com", "//example.com", "/\\example.com", "/login", "/desktop-login", "javascript:alert(1)"])("rejects unsafe or looping return paths: %s", (nextPath) => {
    expect(buildPostLoginDestination({ nextPath, intent: null, billingCycle: "monthly" })).toBe("/account");
  });

  it("preserves query strings and anchors for normal local destinations", () => {
    expect(buildPostLoginDestination({ nextPath: "/account?tab=devices#sessions", intent: null, billingCycle: "monthly" })).toBe("/account?tab=devices#sessions");
  });

  it("builds the checkout login href", () => {
    expect(buildCheckoutLoginHref("monthly")).toBe(
      "/login?next=%2Fpricing&intent=checkout&billing=monthly",
    );
  });

  it("returns the intended destination after login", () => {
    expect(
      buildPostLoginDestination({
        nextPath: "/pricing",
        intent: "checkout",
        billingCycle: "yearly",
      }),
    ).toBe("/pricing?billing=yearly&checkout=1");

    expect(
      buildPostLoginDestination({
        nextPath: null,
        intent: null,
        billingCycle: "monthly",
      }),
    ).toBe("/account");
  });
});
