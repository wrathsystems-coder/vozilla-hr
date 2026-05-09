import { describe, expect, it } from "vitest";
import {
  normalizePhoneE164,
  validateEmail,
  validatePhoneHR,
  validatePostcodeHR,
} from "@/lib/utils/validate";

describe("validatePhoneHR", () => {
  it("accepts +385 international format", () => {
    expect(validatePhoneHR("+385911234567")).toBe(true);
    expect(validatePhoneHR("+385 91 123 4567")).toBe(true);
  });

  it("accepts 0XX national format", () => {
    expect(validatePhoneHR("0911234567")).toBe(true);
    expect(validatePhoneHR("091 123 4567")).toBe(true);
  });

  it("accepts 00385 prefix", () => {
    expect(validatePhoneHR("00385911234567")).toBe(true);
  });

  it("rejects too short / too long", () => {
    expect(validatePhoneHR("0911")).toBe(false);
    expect(validatePhoneHR("0911234567890")).toBe(false);
  });

  it("rejects letters", () => {
    expect(validatePhoneHR("0911234abc")).toBe(false);
  });
});

describe("normalizePhoneE164", () => {
  it("normalizes 0XX, +385, and 00385 prefixes to +385XXXXXXXX", () => {
    expect(normalizePhoneE164("0911234567")).toBe("+385911234567");
    expect(normalizePhoneE164("+385 91 123 4567")).toBe("+385911234567");
    expect(normalizePhoneE164("00385911234567")).toBe("+385911234567");
  });

  it("returns null for invalid HR phones", () => {
    expect(normalizePhoneE164("0911")).toBeNull();
    expect(normalizePhoneE164("0911234abc")).toBeNull();
    expect(normalizePhoneE164("+44 20 7946 0958")).toBeNull();
  });
});

describe("validatePostcodeHR", () => {
  it("accepts 5-digit codes starting with 1-5", () => {
    expect(validatePostcodeHR("10000")).toBe(true);
    expect(validatePostcodeHR("21000")).toBe(true);
    expect(validatePostcodeHR("52000")).toBe(true);
  });

  it("rejects codes starting with 0 or 6+", () => {
    expect(validatePostcodeHR("00000")).toBe(false);
    expect(validatePostcodeHR("60000")).toBe(false);
    expect(validatePostcodeHR("99999")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(validatePostcodeHR("1000")).toBe(false);
    expect(validatePostcodeHR("100000")).toBe(false);
  });
});

describe("validateEmail", () => {
  it("accepts valid email", () => {
    expect(validateEmail("user@example.com")).toEqual({ valid: true });
    expect(validateEmail("first.last+tag@subdomain.example.org")).toEqual({ valid: true });
  });

  it("rejects invalid format", () => {
    expect(validateEmail("not-an-email")).toEqual({
      valid: false,
      reason: "invalid_format",
    });
    expect(validateEmail("missing-tld@domain")).toEqual({
      valid: false,
      reason: "invalid_format",
    });
  });

  it("rejects known disposable domains", () => {
    expect(validateEmail("test@mailinator.com")).toEqual({
      valid: false,
      reason: "disposable",
    });
    expect(validateEmail("FOO@YOPMAIL.COM")).toEqual({
      valid: false,
      reason: "disposable",
    });
  });
});
