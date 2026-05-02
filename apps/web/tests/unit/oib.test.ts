import { describe, expect, it } from "vitest";
import { validateOIB } from "@/lib/utils/oib";

describe("validateOIB", () => {
  it("accepts mathematically valid OIBs", () => {
    expect(validateOIB("12345678903")).toBe(true);
    expect(validateOIB("98765432106")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(validateOIB("1234567890")).toBe(false);
    expect(validateOIB("123456789012")).toBe(false);
    expect(validateOIB("")).toBe(false);
  });

  it("rejects non-digits", () => {
    expect(validateOIB("1234567890a")).toBe(false);
    expect(validateOIB("123 4567890")).toBe(false);
  });

  it("rejects invalid checksum", () => {
    expect(validateOIB("12345678901")).toBe(false);
    expect(validateOIB("00000000000")).toBe(false);
    expect(validateOIB("11111111111")).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    expect(validateOIB(" 12345678903 ")).toBe(true);
  });
});
