import { describe, expect, it } from "vitest";
import { maskEmail } from "@/lib/email/mask";

describe("maskEmail", () => {
  it("keeps first 2 chars of local part + masks rest, preserves domain", () => {
    expect(maskEmail("ana.anic@example.hr")).toBe("an***@example.hr");
  });

  it("handles single-character local parts", () => {
    expect(maskEmail("x@example.hr")).toBe("x***@example.hr");
  });

  it("returns *** when @ is missing (degenerate)", () => {
    expect(maskEmail("not-an-email")).toBe("***");
  });

  it("preserves subdomain in domain part", () => {
    expect(maskEmail("user@mail.vozilla.hr")).toBe("us***@mail.vozilla.hr");
  });
});
