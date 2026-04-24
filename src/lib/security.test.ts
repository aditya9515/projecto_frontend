import { addDays, addMinutes, createOpaqueToken, isExpired, sha256 } from "@/lib/security";

describe("security helpers", () => {
  it("hashes input deterministically", () => {
    expect(sha256("projecto")).toBe(sha256("projecto"));
    expect(sha256("projecto")).not.toBe(sha256("projecto-pro"));
  });

  it("creates opaque random-looking tokens", () => {
    expect(createOpaqueToken()).not.toHaveLength(0);
    expect(createOpaqueToken()).not.toBe(createOpaqueToken());
  });

  it("generates expiry timestamps", () => {
    const now = new Date("2026-04-24T10:00:00.000Z");

    expect(addMinutes(5, now)).toBe("2026-04-24T10:05:00.000Z");
    expect(addDays(30, now)).toBe("2026-05-24T10:00:00.000Z");
  });

  it("detects expiration based on the reference time", () => {
    const reference = new Date("2026-04-24T10:00:00.000Z");

    expect(isExpired("2026-04-24T09:59:59.000Z", reference)).toBe(true);
    expect(isExpired("2026-04-24T10:05:00.000Z", reference)).toBe(false);
  });
});
