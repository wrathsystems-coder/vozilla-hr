import { describe, expect, it } from "vitest";
import { formatPrice, formatDate, formatPhone, formatPostcode } from "@/lib/utils/format";

describe("formatPrice", () => {
  it("formats EUR with HR locale (zarez decimal, point thousands)", () => {
    expect(formatPrice(12345.67)).toMatch(/12\.345,67\s?€/);
    expect(formatPrice(0)).toMatch(/0,00\s?€/);
  });

  it("supports zero decimals option", () => {
    expect(formatPrice(12345, { decimals: 0 })).toMatch(/12\.345\s?€/);
  });
});

describe("formatDate", () => {
  it("formats YYYY-MM-DD as DD.MM.YYYY. (short)", () => {
    expect(formatDate("2026-04-29")).toBe("29.04.2026.");
    expect(formatDate("2026-01-05")).toBe("05.01.2026.");
  });

  it("formats Date instance (short)", () => {
    expect(formatDate(new Date(2026, 3, 29))).toBe("29.04.2026.");
  });

  it("formats long form with HR month names", () => {
    const result = formatDate("2026-04-29", "long");
    expect(result).toMatch(/29.*travnja.*2026/i);
  });

  it("throws for invalid date", () => {
    expect(() => formatDate("not-a-date")).toThrow();
  });
});

describe("formatPhone", () => {
  it("normalizes 0XX prefix to +385 XX", () => {
    expect(formatPhone("0911234567")).toBe("+385 91 123 4567");
  });

  it("normalizes already-international form", () => {
    expect(formatPhone("+385911234567")).toBe("+385 91 123 4567");
  });

  it("normalizes 00385 prefix", () => {
    expect(formatPhone("00385911234567")).toBe("+385 91 123 4567");
  });

  it("ignores spaces and dashes in input", () => {
    expect(formatPhone("091 123-4567")).toBe("+385 91 123 4567");
  });
});

describe("formatPostcode", () => {
  it("validates and returns valid postcode", () => {
    expect(formatPostcode("10000")).toBe("10000");
    expect(formatPostcode("21000")).toBe("21000");
  });

  it("trims whitespace", () => {
    expect(formatPostcode(" 10000 ")).toBe("10000");
  });

  it("throws for invalid postcode", () => {
    expect(() => formatPostcode("9999")).toThrow();
    expect(() => formatPostcode("100000")).toThrow();
    expect(() => formatPostcode("abcde")).toThrow();
  });
});
